const app = document.getElementById("app");
const nav = document.getElementById("nav");
const STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

const state = JSON.parse(sessionStorage.getItem("state") || '{"user":null,"auth":null}');
let cachedEvents = [];
let currentView = "events";

/* ---------- helpers ---------- */
function save() { sessionStorage.setItem("state", JSON.stringify(state)); }
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}
function toast(msg, type = "ok") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "show " + type;
  setTimeout(() => (t.className = ""), 3200);
}
function badge(s) { return `<span class="badge ${s}">${s}</span>`; }
const isCoord = () => state.user && state.user.role === "COORDINATOR";
const isStudent = () => state.user && state.user.role === "STUDENT";

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (state.auth) headers.Authorization = state.auth;
  const res = await fetch(API_URL + path, { ...options, headers });
  const text = await res.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  if (!res.ok) throw new Error((data && data.message) || `Request failed (${res.status})`);
  return data;
}

function renderNav() {
  const links = [["Events", "viewEvents()", "events"]];
  if (isStudent()) links.push(["My Registrations", "viewMyRegistrations()", "my-regs"]);
  if (isCoord()) links.push(["Participants", "viewParticipants()", "participants"], ["Reports", "viewReports()", "reports"]);
  if (!state.user) links.push(["Login", "viewLogin()", "login"], ["Sign Up", "viewSignup()", "signup"]);
  
  nav.innerHTML =
    links.map(([t, f, key]) => `<a href="#" class="${currentView === key ? 'active' : ''}" onclick="${f};return false">${t}</a>`).join("") +
    (state.user
      ? `<span class="user">${esc(state.user.name)} (${state.user.role})</span><a href="#" onclick="logout();return false">Logout</a>`
      : "");
}

function fillCredentials(email, password) {
  const emailInput = document.getElementById("lEmail");
  const passInput = document.getElementById("lPass");
  if (emailInput) emailInput.value = email;
  if (passInput) passInput.value = password;
  toast("Filled " + email);
}

function togglePassword(id, btnId) {
  const input = document.getElementById(id);
  const btn = document.getElementById(btnId);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    if (btn) btn.textContent = "🙈 Hide";
  } else {
    input.type = "password";
    if (btn) btn.textContent = "👁️ Show";
  }
}

/* ---------- auth ---------- */
function viewLogin() {
  currentView = "login";
  renderNav();
  app.innerHTML = `
    <h2>🔐 Account Login</h2>
    <form class="card form" onsubmit="handleLogin(event)">
      <label style="font-size:13px;font-weight:600;color:#475569;">Email Address</label>
      <input id="lEmail" type="email" placeholder="name@college.edu" required autocomplete="email">
      
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
        <label style="font-size:13px;font-weight:600;color:#475569;">Password</label>
        <button type="button" id="togglePassBtn" class="secondary" style="padding:2px 8px;font-size:12px;margin:0;" onclick="togglePassword('lPass', 'togglePassBtn')">👁️ Show</button>
      </div>
      <input id="lPass" type="password" placeholder="••••••••" required autocomplete="current-password">
      
      <button type="submit">Sign In</button>
      
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid #e2e8f0;">
        <p style="font-size:13px;font-weight:600;color:#475569;margin-bottom:8px;">🚀 Quick Demo Fill (1-Click):</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="secondary" style="font-size:12px;padding:6px 12px;margin:0;" onclick="fillCredentials('coordinator@college.edu', 'admin123')">👔 Coordinator Demo</button>
          <button type="button" class="secondary" style="font-size:12px;padding:6px 12px;margin:0;" onclick="fillCredentials('john@student.edu', 'password123')">🎓 Student Demo</button>
        </div>
      </div>

      <p class="hint" style="margin-top:14px;">Are you a new student? <a href="#" onclick="viewSignup();return false" style="color:#4f46e5;font-weight:700;">Click here to Sign Up first</a></p>
    </form>`;
}

async function handleLogin(ev) {
  ev.preventDefault();
  const email = val("lEmail").trim().toLowerCase();
  const pass = (document.getElementById("lPass")?.value || "").trim();
  state.auth = "Basic " + btoa(unescape(encodeURIComponent(email + ":" + pass)));
  try {
    state.user = await api("/auth/me");
    save();
    toast("Welcome back, " + state.user.name);
    viewEvents();
  } catch (e) {
    state.auth = null;
    state.user = null;
    save();
    toast("Invalid credentials. Please verify your email and password, or use the 1-Click Demo buttons below.", "err");
  }
}

function viewSignup() {
  currentView = "signup";
  renderNav();
  app.innerHTML = `
    <h2>📝 Student Registration</h2>
    <form class="card form" onsubmit="handleSignup(event)">
      <label style="font-size:13px;font-weight:600;color:#475569;">Full Name</label>
      <input id="sName" placeholder="e.g. Alex Johnson" required>
      <label style="font-size:13px;font-weight:600;color:#475569;">Email Address</label>
      <input id="sEmail" type="email" placeholder="alex@student.edu" required>
      <label style="font-size:13px;font-weight:600;color:#475569;">Password (min 6 characters)</label>
      <input id="sPass" type="password" placeholder="••••••••" required minlength="6">
      <label style="font-size:13px;font-weight:600;color:#475569;">Roll / Student ID Number</label>
      <input id="sRoll" placeholder="e.g. CS202601" required>
      <label style="font-size:13px;font-weight:600;color:#475569;">Department</label>
      <input id="sDept" placeholder="e.g. Computer Science" required>
      <label style="font-size:13px;font-weight:600;color:#475569;">Contact Phone (10 digits)</label>
      <input id="sPhone" placeholder="10-digit mobile number" required pattern="\\d{10}">
      <button type="submit">Create Student Account</button>
      <p class="hint" style="margin-top:10px;">Already have an account? <a href="#" onclick="viewLogin();return false" style="color:#4f46e5;font-weight:700;">Sign in here</a></p>
    </form>`;
}

async function handleSignup(ev) {
  ev.preventDefault();
  const body = {
    name: val("sName").trim(),
    email: val("sEmail").trim().toLowerCase(),
    password: (document.getElementById("sPass")?.value || "").trim(),
    rollNumber: val("sRoll").trim(),
    department: val("sDept").trim(),
    phone: val("sPhone").trim()
  };
  try {
    state.auth = null;
    await api("/auth/signup", { method: "POST", body: JSON.stringify(body) });
    toast("Account created successfully. Please login.");
    viewLogin();
  } catch (e) { toast(e.message, "err"); }
}

function logout() {
  state.user = null;
  state.auth = null;
  save();
  toast("Logged out");
  viewLogin();
}

/* ---------- events ---------- */
async function viewEvents(keyword = "") {
  currentView = "events";
  renderNav();
  try {
    cachedEvents = await api("/events?keyword=" + encodeURIComponent(keyword));
    app.innerHTML = `
      <h2>${isCoord() ? "🛠️ Manage Events" : "🎉 Upcoming Campus Events"}</h2>
      ${isCoord() ? eventForm() : ""}
      <div class="toolbar">
        <input id="q" placeholder="Search by title or venue..." value="${esc(keyword)}" onkeydown="if(event.key==='Enter') viewEvents(this.value)">
        <button onclick="viewEvents(val('q'))">Search</button>
      </div>
      ${isCoord() ? eventTable(cachedEvents) : eventCards(cachedEvents)}`;
  } catch (e) { toast(e.message, "err"); }
}

function eventCards(events) {
  if (!events.length) {
    return `<div class="card" style="text-align:center;padding:40px;"><p style="font-size:16px;">🔍 No events found matching your search.</p></div>`;
  }
  return `<div class="grid">` + events.map(e => `
    <div class="card">
      <h3>${esc(e.title)}</h3>
      <p>${esc(e.description)}</p>
      <p>📍 <strong>Venue:</strong> ${esc(e.venue)}</p>
      <p>📅 <strong>Date:</strong> ${esc(e.eventDate)}</p>
      <p>👥 <strong>Capacity:</strong> ${e.maxParticipants} participants</p>
      ${isStudent()
        ? `<button onclick="registerEvent(${e.id})">Register Now</button>`
        : !state.user ? `<p class="hint">Log in as a student to register for this event</p>` : ""}
    </div>`).join("") + `</div>`;
}

function eventTable(events) {
  if (!events.length) {
    return `<div class="card" style="text-align:center;padding:40px;"><p style="font-size:16px;">🔍 No events found.</p></div>`;
  }
  return `<div class="table-wrap"><table>
    <thead><tr><th>Title</th><th>Venue</th><th>Date</th><th>Capacity</th><th>Actions</th></tr></thead>
    <tbody>` + events.map(e => `
      <tr>
        <td><strong>${esc(e.title)}</strong></td><td>${esc(e.venue)}</td><td>${esc(e.eventDate)}</td><td>${e.maxParticipants}</td>
        <td>
          <button onclick="editEvent(${e.id})">Edit</button>
          <button class="danger" onclick="deleteEvent(${e.id})">Delete</button>
        </td>
      </tr>`).join("") + `</tbody></table></div>`;
}

function eventForm() {
  return `
    <form id="eventForm" class="card form" onsubmit="saveEvent(event)">
      <h3 id="formTitle">Create New Event</h3>
      <input type="hidden" id="eId">
      <label style="font-size:13px;font-weight:600;color:#475569;">Event Title</label>
      <input id="eTitle" placeholder="e.g. Hackathon 2026" required>
      <label style="font-size:13px;font-weight:600;color:#475569;">Venue / Location</label>
      <input id="eVenue" placeholder="e.g. Auditorium Hall B" required>
      <label style="font-size:13px;font-weight:600;color:#475569;">Event Date</label>
      <input id="eDate" type="date" required>
      <label style="font-size:13px;font-weight:600;color:#475569;">Max Participants</label>
      <input id="eMax" type="number" min="1" placeholder="e.g. 150" required>
      <label style="font-size:13px;font-weight:600;color:#475569;">Description</label>
      <textarea id="eDesc" placeholder="Event details, schedule, requirements..."></textarea>
      <div style="display:flex;gap:10px;">
        <button type="submit">Save Event</button>
        <button type="button" class="secondary" onclick="viewEvents()">Cancel</button>
      </div>
    </form>`;
}

function editEvent(id) {
  const e = cachedEvents.find(x => x.id === id);
  if (!e) return;
  document.getElementById("formTitle").textContent = "Edit Event Details";
  document.getElementById("eId").value = e.id;
  document.getElementById("eTitle").value = e.title;
  document.getElementById("eVenue").value = e.venue;
  document.getElementById("eDate").value = e.eventDate;
  document.getElementById("eMax").value = e.maxParticipants;
  document.getElementById("eDesc").value = e.description || "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveEvent(ev) {
  ev.preventDefault();
  const id = val("eId");
  const body = {
    title: val("eTitle"), venue: val("eVenue"), eventDate: val("eDate"),
    maxParticipants: Number(val("eMax")), description: val("eDesc")
  };
  try {
    await api(id ? `/events/${id}` : "/events", { method: id ? "PUT" : "POST", body: JSON.stringify(body) });
    toast("Event saved successfully");
    viewEvents();
  } catch (e) { toast(e.message, "err"); }
}

async function deleteEvent(id) {
  if (!confirm("Are you sure you want to delete this event and all associated registrations?")) return;
  try {
    await api(`/events/${id}`, { method: "DELETE" });
    toast("Event deleted");
    viewEvents();
  } catch (e) { toast(e.message, "err"); }
}

/* ---------- student registrations ---------- */
async function registerEvent(id) {
  try {
    await api(`/registrations/event/${id}`, { method: "POST" });
    toast("Registered successfully (Status: PENDING)");
    viewMyRegistrations();
  } catch (e) { toast(e.message, "err"); }
}

async function viewMyRegistrations() {
  currentView = "my-regs";
  renderNav();
  try {
    const regs = await api("/registrations/my");
    app.innerHTML = `<h2>📋 My Registrations</h2>` + (regs.length
      ? `<div class="table-wrap"><table>
          <thead><tr><th>Event</th><th>Venue</th><th>Event Date</th><th>Registered On</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>` + regs.map(r => `
            <tr>
              <td><strong>${esc(r.event.title)}</strong></td><td>${esc(r.event.venue)}</td><td>${esc(r.event.eventDate)}</td>
              <td>${esc(r.registrationDate)}</td><td>${badge(r.status)}</td>
              <td>${["PENDING", "APPROVED"].includes(r.status)
                ? `<button class="danger" onclick="cancelReg(${r.id})">Cancel Registration</button>` : ""}</td>
            </tr>`).join("") + `</tbody></table></div>`
      : `<div class="card" style="text-align:center;padding:40px;"><p style="font-size:16px;">You have not registered for any events yet.</p></div>`);
  } catch (e) { toast(e.message, "err"); }
}

async function cancelReg(id) {
  if (!confirm("Cancel this registration?")) return;
  try {
    await api(`/registrations/${id}/cancel`, { method: "PUT" });
    toast("Registration cancelled");
    viewMyRegistrations();
  } catch (e) { toast(e.message, "err"); }
}

/* ---------- coordinator: participants ---------- */
async function viewParticipants(keyword = "") {
  currentView = "participants";
  renderNav();
  try {
    const regs = await api("/registrations?keyword=" + encodeURIComponent(keyword));
    app.innerHTML = `
      <h2>👥 Participants & Registration History</h2>
      <div class="toolbar">
        <input id="q" placeholder="Search by student, roll no or event..." value="${esc(keyword)}" onkeydown="if(event.key==='Enter') viewParticipants(this.value)">
        <button onclick="viewParticipants(val('q'))">Search</button>
      </div>` + (regs.length
      ? `<div class="table-wrap"><table>
          <thead><tr><th>Student</th><th>Roll No</th><th>Department</th><th>Phone</th><th>Event</th><th>Date</th><th>Status</th><th>Update Status</th></tr></thead>
          <tbody>` + regs.map(r => `
            <tr>
              <td><strong>${esc(r.student.name)}</strong></td><td>${esc(r.student.rollNumber)}</td>
              <td>${esc(r.student.department)}</td><td>${esc(r.student.phone)}</td>
              <td>${esc(r.event.title)}</td><td>${esc(r.registrationDate)}</td>
              <td>${badge(r.status)}</td>
              <td><select onchange="updateStatus(${r.id}, this.value)">
                ${STATUSES.map(s => `<option value="${s}" ${s === r.status ? "selected" : ""}>${s}</option>`).join("")}
              </select></td>
            </tr>`).join("") + `</tbody></table></div>`
      : `<div class="card" style="text-align:center;padding:40px;"><p style="font-size:16px;">No registrations found matching your query.</p></div>`);
  } catch (e) { toast(e.message, "err"); }
}

async function updateStatus(id, status) {
  try {
    await api(`/registrations/${id}/status?status=${status}`, { method: "PUT" });
    toast("Status updated to " + status);
    viewParticipants(val("q"));
  } catch (e) { toast(e.message, "err"); }
}

/* ---------- coordinator: reports ---------- */
async function viewReports() {
  currentView = "reports";
  renderNav();
  try {
    const s = await api("/reports/summary");
    const items = [
      ["Total Events", s.totalEvents], ["Registered Students", s.totalStudents],
      ["Total Registrations", s.totalRegistrations], ["Pending Approvals", s.pending],
      ["Approved Attendees", s.approved], ["Rejected", s.rejected], ["Cancelled", s.cancelled]
    ];
    app.innerHTML = `<h2>📊 Event Analytics & Reports</h2><div class="stats">` +
      items.map(([label, v]) => `<div class="stat"><b>${v}</b><span style="font-size:14px;color:#64748b;font-weight:600;">${label}</span></div>`).join("") + `</div>`;
  } catch (e) { toast(e.message, "err"); }
}

/* ---------- start ---------- */
viewEvents();
