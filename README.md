# College Event Registration - Frontend (HTML + CSS + JavaScript)

## Run locally (VS Code)
Start the backend first, then right-click index.html -> "Open with Live Server".

## Point it at your backend
Edit js/config.js:
    const API_URL = "https://<your-backend-url>/api";

## Run with Docker
    docker build -t event-frontend .
    docker run -p 3000:80 event-frontend
Open http://localhost:3000

## Deploy
- Static: drag this folder into Netlify, or use Vercel / Render Static Site / GitHub Pages.
- Docker: push this folder to GitHub and create a Docker web service on Render / Railway (uses the Dockerfile, port 80).

## Logins
Coordinator: coordinator@college.edu / admin123
Students: use Sign Up.
