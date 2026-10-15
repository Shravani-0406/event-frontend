// Dynamic API endpoint: connects to http://localhost:8080/api from frontend port 3000,
// and uses relative /api if served directly from backend.
const API_URL = window.location.port === "3000"
  ? "http://localhost:8080/api"
  : (window.location.origin.includes("localhost") ? "http://localhost:8080/api" : "/api");

