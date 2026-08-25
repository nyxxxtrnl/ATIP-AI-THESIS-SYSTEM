ATIP-AI Dashboard Demo

Files:
- index.html  — dashboard structure and all functional views
- styles.css  — responsive visual design and animations
- script.js   — navigation, camera, selfie mirroring, live demo metrics, activities, chat, settings and local session history

Run:
1. Put the three files in the same folder.
2. Open the folder with a local web server (recommended) because browser camera APIs require a secure context.
   Example: VS Code Live Server, or `python -m http.server 8000`.
3. Visit http://localhost:8000/ and click Live Detection > Start Camera.
4. Allow camera permission when the browser asks.

Note: The live metrics in this standalone demo are simulated UI values; camera access and selfie mirroring are real. For production-grade emotion/face recognition, connect a consented ML model/backend.
