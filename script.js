const signupView = document.getElementById("signupView");
const loginView = document.getElementById("loginView");
const illustration = document.getElementById("mainIllustration");
const toast = document.getElementById("toast");

const show = (message) => {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
};

function switchView(view) {
  const isLogin = view === "login";
  signupView.classList.toggle("hidden", isLogin);
  loginView.classList.toggle("hidden", !isLogin);
  illustration.src = isLogin
    ? "assets/login-illustration.svg"
    : "assets/signup-illustration.svg";

  // Restart the view animation.
  const active = isLogin ? loginView : signupView;
  active.classList.remove("auth-view");
  void active.offsetWidth;
  active.classList.add("auth-view");
}

document.getElementById("showLogin").addEventListener("click", () => switchView("login"));
document.getElementById("showSignup").addEventListener("click", () => switchView("signup"));

document.querySelectorAll(".eye").forEach(button => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    input.type = input.type === "password" ? "text" : "password";
    button.textContent = input.type === "password" ? "◉" : "◌";
  });
});

function saveLoggedInUser(name, email) {
  const userName = (name || email || "User").trim();
  const cleanName = userName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

  const user = {
    name: cleanName || "User",
    email: (email || "").trim(),
    loggedInAt: new Date().toISOString()
  };

  localStorage.setItem("atipAiUser", JSON.stringify(user));
}

document.getElementById("signupForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("fullName");
  const email = document.getElementById("signupEmail");
  const password = document.getElementById("signupPassword");
  const confirm = document.getElementById("confirmPassword");

  if (!name.value.trim() || !email.value.trim() || !password.value || !confirm.value) {
    show("Please complete all fields.");
    document.getElementById("signupForm").classList.add("shake");
    setTimeout(() => document.getElementById("signupForm").classList.remove("shake"), 400);
    return;
  }

  if (password.value !== confirm.value) {
    show("Passwords do not match.");
    confirm.focus();
    return;
  }

  saveLoggedInUser(name.value, email.value);
  show("Account created successfully.");
  setTimeout(() => {
    window.location.href = "ATIP AI DASHBOARD/index.html";
  }, 500);
});

document.getElementById("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("loginEmail");
  const password = document.getElementById("loginPassword");

  if (!email.value.trim() || !password.value) {
    show("Please enter your email and password.");
    return;
  }

  const emailValue = email.value.trim();
  const fallbackName = emailValue.split("@")[0]
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());

  saveLoggedInUser(fallbackName, emailValue);
  show("Signing in...");
  setTimeout(() => {
    window.location.href = "ATIP AI DASHBOARD/index.html";
  }, 500);
});

document.querySelectorAll(".social").forEach(button => {
  button.addEventListener("click", () => {
    show(`${button.dataset.provider} sign-in selected.`);
  });
});

document.getElementById("forgotPassword").addEventListener("click", () => {
  show("Password recovery can be connected to your backend.");
});
