// =========================
// BASE URL (CRITICAL FIX)
// =========================
const BASE_URL = "https://nexa-safety-production.up.railway.app";

// =========================
// SECURITY CHECK
// =========================
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

// Debug (remove later)
console.log("TOKEN:", token);

// =========================
// HEADERS
// =========================
const headers = {
    "Content-Type": "application/json",
    "Authorization": token
};

// =========================
// LOGOUT
// =========================
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    window.location.href = "login.html";
}

// =========================
// SAFE FETCH (IMPROVED)
// =========================
async function safeFetch(endpoint) {
    try {
        const res = await fetch(BASE_URL + endpoint, {
            headers
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        return await res.json();

    } catch (err) {
        console.error("API ERROR:", endpoint, err);
        return null;
    }
}
// =========================
// LOAD DASHBOARD
// =========================
async function loadDashboard() {

    const el = document.getElementById("stats");

    if (!el) return;

    el.innerHTML = "Loading dashboard...";

    const data = await safeFetch("/dashboard");

    if (!data) {
        el.innerHTML = "<p style='color:red'>Failed to load dashboard</p>";
        return;
    }

    el.innerHTML = `
        <h3>📊 Total Incidents: ${data.total}</h3>
        <p>🔴 High: ${data.high}</p>
        <p>🟠 Medium: ${data.medium}</p>
        <p>🟢 Low: ${data.low}</p>
    `;
}

// =========================
// LOAD RISK ANALYSIS
// =========================
async function loadRiskAnalysis() {

    const el = document.getElementById("riskContainer");

    if (!el) return;

    el.innerHTML = "Loading risk analysis...";

    const data = await safeFetch("/risk-analysis");

    if (!data) {
        el.innerHTML = "<p style='color:red'>Failed to load risk analysis</p>";
        return;
    }

    if (!Array.isArray(data) || data.length === 0) {
        el.innerHTML = "<p>No incidents found</p>";
        return;
    }

    let html = "<h3>⚠ Risk Analysis Engine</h3>";

    data.forEach(item => {

        let levelColor = "#22c55e"; // LOW
        if (item.level === "MEDIUM") levelColor = "#f59e0b";
        if (item.level === "HIGH") levelColor = "#ef4444";
        if (item.level === "INTOLERABLE") levelColor = "#dc2626";

        html += `
            <div class="card" style="border-left: 5px solid ${levelColor}">
                <p><b>📍 Location:</b> ${item.location}</p>
                <p><b>⚠ Severity:</b> ${item.severity}</p>
                <p><b>📊 Risk Index:</b> ${item.riskIndex}</p>
                <p><b>🔮 Predicted Risk:</b> ${item.predictedRisk}</p>
                <p><b>🚦 Level:</b> ${item.level}</p>
            </div>
            <hr/>
        `;
    });

    el.innerHTML = html;
}

// =========================
// INIT (SMART START)
// =========================
async function init() {

    console.log("🚀 NEXA Dashboard Initializing...");

    await loadDashboard();
    await loadRiskAnalysis();

    // Auto refresh (SaaS behaviour)
    setInterval(loadDashboard, 60000);
    setInterval(loadRiskAnalysis, 60000);
}

// =========================
// START
// =========================
init();