
// =========================
// SECURITY CHECK (MUST BE FIRST)
// =========================
if (!localStorage.getItem("token")) {
    window.location.href = "login.html";
}

// =========================
// AUTH HEADERS
// =========================
const token = localStorage.getItem("token");

const headers = {
    "Content-Type": "application/json",
    "Authorization": token
};

// =========================
// LOGOUT FUNCTION
// =========================
function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");

    window.location.href = "login.html";
}

// =========================
// LOAD DASHBOARD
// =========================
async function loadDashboard() {

    const res = await fetch("/dashboard", { headers });
    const data = await res.json();

    document.getElementById("stats").innerHTML = `
        <h3>Total Incidents: ${data.total}</h3>
        <p>🔴 High: ${data.high}</p>
        <p>🟠 Medium: ${data.medium}</p>
        <p>🟢 Low: ${data.low}</p>
    `;
}

// =========================
// LOAD RISK ANALYSIS
// =========================
async function loadRiskAnalysis() {

    const res = await fetch("/risk-analysis", { headers });
    const data = await res.json();

    let html = "<h3>Risk Analysis</h3>";

    data.forEach(item => {
        html += `
            <div class="card">
                <p><b>Location:</b> ${item.location}</p>
                <p><b>Severity:</b> ${item.severity}</p>
                <p><b>Risk Index:</b> ${item.riskIndex}</p>
                <p><b>Predicted Risk:</b> ${item.predictedRisk}</p>
                <p><b>Level:</b> ${item.level}</p>
            </div>
            <hr/>
        `;
    });

    document.getElementById("riskContainer").innerHTML = html;
}

// =========================
// INIT APP
// =========================
loadDashboard();
loadRiskAnalysis();