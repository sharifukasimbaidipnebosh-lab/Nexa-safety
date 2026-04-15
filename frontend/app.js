// =========================
// SECURITY CHECK (MUST BE FIRST)
// =========================
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

// =========================
// SAFE HEADERS
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
// SAFE FETCH WRAPPER
// =========================
async function safeFetch(url) {
    try {
        const res = await fetch(url, { headers });

        if (!res.ok) {
            throw new Error(`HTTP error ${res.status}`);
        }

        return await res.json();

    } catch (err) {
        console.error("API Error:", url, err);
        return null;
    }
}

// =========================
// LOAD DASHBOARD STATS
// =========================
async function loadDashboard() {

    const data = await safeFetch("/dashboard");

    if (!data) {
        document.getElementById("stats").innerHTML =
            "<p style='color:red'>Failed to load dashboard</p>";
        return;
    }

    document.getElementById("stats").innerHTML = `
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

    const data = await safeFetch("/risk-analysis");

    if (!data) {
        document.getElementById("riskContainer").innerHTML =
            "<p style='color:red'>Failed to load risk analysis</p>";
        return;
    }

    let html = "<h3>⚠ Risk Analysis Engine</h3>";

    data.forEach(item => {

        // Risk level styling (future UI upgrade ready)
        let levelClass = "";
        if (item.level === "HIGH") levelClass = "level-high";
        if (item.level === "MEDIUM") levelClass = "level-medium";
        if (item.level === "LOW") levelClass = "level-low";

        html += `
            <div class="card ${levelClass}">
                <p><b>📍 Location:</b> ${item.location}</p>
                <p><b>⚠ Severity:</b> ${item.severity}</p>
                <p><b>📊 Risk Index:</b> ${item.riskIndex}</p>
                <p><b>🔮 Predicted Risk:</b> ${item.predictedRisk}</p>
                <p><b>🚦 Level:</b> ${item.level}</p>
            </div>
        `;
    });

    document.getElementById("riskContainer").innerHTML = html;
}

// =========================
// AUTO REFRESH SYSTEM (SAAS FEATURE)
// =========================
async function init() {
    await loadDashboard();
    await loadRiskAnalysis();

    // refresh every 60 seconds (real SaaS behavior)
    setInterval(loadDashboard, 60000);
    setInterval(loadRiskAnalysis, 60000);
}

// =========================
// START APP
// =========================
init();