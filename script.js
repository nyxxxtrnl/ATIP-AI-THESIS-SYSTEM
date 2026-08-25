const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

let stream = null;
let mirror = true;
let sessionStart = null;
let timerInterval = null;
let detectionInterval = null;
let sessions = JSON.parse(localStorage.getItem('atipAiSessions') || '[]');
let activityInterval = null;

const emotions = ['Calm','Happy','Neutral','Focused','Relaxed','Thoughtful'];

function getLoggedInUser() {
  try {
    const user = JSON.parse(localStorage.getItem('atipAiUser') || 'null');
    return user && user.name ? user.name : 'User';
  } catch {
    return 'User';
  }
}

function updateWelcomeMessage() {
  const greetingEl = document.getElementById('welcomeGreeting');
  const subtextEl = document.getElementById('welcomeSubtext');
  const profileNameEl = document.getElementById('profileName');
  const dateCardText = document.getElementById('dateCardText');
  const userName = getLoggedInUser();
  const now = new Date();
  const hour = now.getHours();

  let greeting = 'Good morning';
  if (hour >= 12 && hour < 18) greeting = 'Good afternoon';
  if (hour >= 18 || hour < 5) greeting = 'Good evening';

  greetingEl.innerHTML = `${greeting}, ${userName}! <span>👋</span>`;
  subtextEl.textContent = 'Welcome back to ATIP-AI. Let’s take care of your mind and well-being.';
  profileNameEl.textContent = userName;

  const dateLabel = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const dayLabel = now.toLocaleDateString('en-US', { weekday: 'long' });

  if (dateCardText) {
    dateCardText.innerHTML = `${dateLabel}<br><small>${dayLabel}</small>`;
  }
}
const recommendations = {
  Calm: ['Keep this steady pace','A short breathing break can help maintain your calm.'],
  Happy: ['Carry the good feeling forward','Try a quick gratitude reflection while your mood is positive.'],
  Neutral: ['Check in with yourself','Take three slow breaths and name one thing you need right now.'],
  Focused: ['Protect your focus','A two-minute reset can help you return to your task refreshed.'],
  Relaxed: ['Stay grounded','Notice five things around you to extend the relaxed feeling.'],
  Thoughtful: ['Give your thoughts room','A short reflection can help turn thoughts into clear next steps.']
};

function toast(message){
  const el=$('#toast'); el.textContent=message; el.classList.add('show');
  clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2600);
}
function formatTime(seconds){
  const h=String(Math.floor(seconds/3600)).padStart(2,'0');
  const m=String(Math.floor((seconds%3600)/60)).padStart(2,'0');
  const s=String(seconds%60).padStart(2,'0'); return `${h}:${m}:${s}`;
}
function currentDuration(){ return sessionStart ? Math.floor((Date.now()-sessionStart)/1000) : 0; }

function showView(name){
  $$('.view').forEach(v=>v.classList.remove('active-view'));
  const target=$(`#view-${name}`); if(target) target.classList.add('active-view');
  $$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===name));
  if(name==='history') renderHistory();
  if(name==='dashboard') updateDashboard();
  $('#sidebar').classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
}
$$('.nav-item').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));
$$('[data-view]').forEach(btn=>{ if(!btn.classList.contains('nav-item')) btn.addEventListener('click',()=>showView(btn.dataset.view)); });
$('#menuBtn').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#notificationBtn').addEventListener('click',()=>toast('You have 3 wellness notifications.'));
$('#profileMenuBtn').addEventListener('click',()=>showView('profile'));

async function startCamera(){
  if(!navigator.mediaDevices?.getUserMedia){ toast('Camera access is not supported by this browser.'); return false; }
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}},audio:false});
    const video=$('#cameraVideo'); video.srcObject=stream; video.style.display='block'; video.style.transform=mirror?'scaleX(-1)':'scaleX(1)';
    $('#cameraPlaceholder').style.display='none'; $('.face-guide').style.display='block'; $('#scanLine').style.display='block';
    $('#cameraStatus').textContent='Camera live'; $('#cameraStatus').style.background='#e9f9ee'; $('#cameraStatus').style.color='#318b57';
    $('#faceStatus').textContent='Tracking preview';
    if(!sessionStart) startSession();
    toast('Camera started. Your selfie preview is mirrored.');
    return true;
  }catch(err){
    console.error(err); toast(err.name==='NotAllowedError'?'Camera permission was denied. Please allow camera access.':'Could not start the camera. Try HTTPS or localhost.');
    return false;
  }
}
function stopCamera(){
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
  $('#cameraVideo').style.display='none'; $('#cameraVideo').srcObject=null; $('#cameraPlaceholder').style.display='block'; $('.face-guide').style.display='none'; $('#scanLine').style.display='none';
  $('#cameraStatus').textContent='Camera off'; $('#cameraStatus').style.background='#f0ecff'; $('#cameraStatus').style.color='#6245d2'; $('#faceStatus').textContent='Not detected';
  stopSession(); toast('Camera stopped.');
}
function toggleMirror(){
  mirror=!mirror; $('#cameraVideo').style.transform=mirror?'scaleX(-1)':'scaleX(1)'; $('#mirrorStatus').textContent=mirror?'On':'Off'; $('#mirrorToggle').checked=mirror; toast(mirror?'Selfie mirroring on.':'Selfie mirroring off.');
}
$('#cameraStart').addEventListener('click',startCamera); $('#cameraStop').addEventListener('click',stopCamera); $('#flipCamera').addEventListener('click',toggleMirror);
$('#mirrorToggle').addEventListener('change',e=>{mirror=e.target.checked;$('#cameraVideo').style.transform=mirror?'scaleX(-1)':'scaleX(1)';$('#mirrorStatus').textContent=mirror?'On':'Off'});

function startSession(){
  if(sessionStart) return;
  sessionStart=Date.now();
  timerInterval=setInterval(updateTimers,1000); detectionInterval=setInterval(fakeDetection,2200); fakeDetection(); updateTimers();
  $('#sessionSub').textContent='Live detection active';
}
function stopSession(){
  if(!sessionStart) return;
  clearInterval(timerInterval); clearInterval(detectionInterval); timerInterval=null; detectionInterval=null;
  sessionStart=null; $('#sessionSub').textContent='No active session'; $('#liveTimer').textContent='00:00:00';
}
function updateTimers(){
  const t=formatTime(currentDuration()); $('#timerStat').textContent=t; $('#liveTimer').textContent=t;
}
function fakeDetection(){
  const emotion=emotions[Math.floor(Math.random()*emotions.length)];
  const confidence=Math.floor(72+Math.random()*25);
  const stress=Math.floor(20+Math.random()*62);
  const stressLabel=stress<35?'Low':stress<65?'Moderate':'Elevated';
  $('#emotionStat').textContent=emotion; $('#emotionSub').textContent='Live session updated'; $('#confidenceStat').textContent=`${confidence}%`; $('#stressStat').textContent=stressLabel;
  $('#heroEmotion').textContent=emotion; $('#heroStress').textContent=stressLabel; $('#heroConfidence').textContent=`${confidence}%`;
  $('#liveEmotion').textContent=emotion; $('#liveConfidence').textContent=`Confidence ${confidence}%`; $('#liveStressText').textContent=`${stressLabel} (${stress}%)`; $('#stressBar').style.width=`${stress}%`;
  $('#gaugeNumber').innerHTML=`${stress}<small>${stressLabel}</small>`;
  $('#insightEmotion').textContent=emotion; $('#insightConfidence').textContent=`${confidence}%`; $('#insightStress').textContent=stressLabel;
  $('#recTitle').textContent=recommendations[emotion][0]; $('#recText').textContent=recommendations[emotion][1];
}
function updateDashboard(){ if(sessionStart) fakeDetection(); }

async function startFromAnywhere(){ showView('live'); await startCamera(); }
$('#startHero').addEventListener('click',startFromAnywhere); $('#startRec').addEventListener('click',startFromAnywhere); $('#historyStart').addEventListener('click',startFromAnywhere);

$('#saveSession').addEventListener('click',()=>{
  if(!sessionStart){toast('Start a live session first.');return;}
  const duration=currentDuration(); const emotion=$('#liveEmotion').textContent; const confidence=$('#liveConfidence').textContent.replace(/\D/g,'').slice(0,3)||'--'; const stress=$('#liveStressText').textContent;
  sessions.unshift({date:new Date().toLocaleString(),emotion,confidence,stress,duration}); localStorage.setItem('atipAiSessions',JSON.stringify(sessions)); renderHistory(); toast('Session saved locally.');
});
function renderHistory(){
  const box=$('#historyRows');
  if(!sessions.length){box.innerHTML='<div class="no-history">No saved sessions yet.</div>';$('#historyTitle').textContent='No sessions yet';return;}
  $('#historyTitle').textContent=`${sessions.length} session${sessions.length===1?'':'s'}`;
  box.innerHTML=sessions.slice(0,12).map(x=>`<div class="history-row"><span>${x.date}</span><span>${x.emotion}</span><span>${x.confidence}%</span><span>${x.stress}</span><span>${formatTime(x.duration)}</span></div>`).join('');
}
$('#clearHistory').addEventListener('click',()=>{sessions=[];localStorage.removeItem('atipAiSessions');renderHistory();toast('History cleared.');});

$$('[data-activity]').forEach(btn=>btn.addEventListener('click',()=>openActivity(btn.dataset.activity)));
function openActivity(type){
  const info={Breathing:['≋','Breathing','Inhale for 4 seconds, hold for 4, exhale for 4.'],Mindfulness:['♟','Mindfulness','Notice your breath, your body, and three things around you.'],Reflection:['▤','Reflection','Take a moment to write what you feel and what you need.']}[type];
  $('#modalIcon').textContent=info[0];$('#modalTitle').textContent=info[1];$('#modalText').textContent=info[2];$('#activityTimer').textContent=type==='Breathing'?'03:00':type==='Mindfulness'?'05:00':'02:00';$('#activityStart').textContent='Start';$('#breathCircle').classList.remove('running');$('#activityModal').classList.add('show');$('#activityStart').dataset.type=type;
}
$('#modalClose').addEventListener('click',()=>{clearInterval(activityInterval);$('#activityModal').classList.remove('show');});
$('#activityStart').addEventListener('click',()=>{
  if(activityInterval){clearInterval(activityInterval);activityInterval=null;$('#activityStart').textContent='Start';$('#breathCircle').classList.remove('running');return;}
  let total=$('#activityStart').dataset.type==='Breathing'?180:$('#activityStart').dataset.type==='Mindfulness'?300:120;
  $('#activityStart').textContent='Pause';$('#breathCircle').classList.add('running');
  activityInterval=setInterval(()=>{total--;const m=String(Math.floor(total/60)).padStart(2,'0'),s=String(total%60).padStart(2,'0');$('#activityTimer').textContent=`${m}:${s}`;if(total<=0){clearInterval(activityInterval);activityInterval=null;$('#activityStart').textContent='Done';$('#breathCircle').classList.remove('running');toast('Wellness activity complete. Nice work.');}},1000);
});

$('#chatForm').addEventListener('submit',e=>{e.preventDefault();const input=$('#chatInput');const text=input.value.trim();if(!text)return;addBubble(text,'user');input.value='';setTimeout(()=>{const replies=['Thank you for sharing that. What part feels most important right now?','That sounds worth noticing. Try taking one slow breath before deciding what to do next.','You do not have to solve everything at once. What is one small step that would help?'];addBubble(replies[Math.floor(Math.random()*replies.length)],'ai');},500)});
function addBubble(text,who){const d=document.createElement('div');d.className=`bubble ${who}`;d.textContent=text;$('#chatMessages').appendChild(d);$('#chatMessages').scrollTop=$('#chatMessages').scrollHeight;}

$('#animationsToggle').addEventListener('change',e=>document.body.classList.toggle('no-animations',!e.target.checked));
$('#notificationsToggle').addEventListener('change',e=>{$('#notificationBtn').style.opacity=e.target.checked?'1':'.45';toast(e.target.checked?'Notifications enabled.':'Notifications hidden.');});
$('#saveProfile').addEventListener('click',()=>toast('Profile saved for this demo.'));

updateWelcomeMessage();
renderHistory();
setInterval(updateWelcomeMessage, 60000);
