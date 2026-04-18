console.log("🔥 NEXA FRONTEND LOADED");

/* =========================
   AUTH CHECK
========================= */
const token = localStorage.getItem("token");

// Protect dashboard & incident pages
if (!token && (
    window.location.pathname.includes("dashboard") ||
    window.location.pathname.includes("incident")
)) {
    window.location.href = "/login.html";
}

/* =========================
   BASE HEADERS
========================= */
function getHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": localStorage.getItem("token")
    };
}

/* =========================
   LOGOUT
========================= */
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    window.location.href = "/login.html";
}

/* =========================
   SAFE API CALL
========================= */
async function api(url, options = {}) {
    try {
        const res = await fetch(url, {
            ...options,
            headers: {
                ...getHeaders(),
                ...(options.headers || {})
            }
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || `HTTP ${res.status}`);
        }

        return await res.json();

    } catch (err) {
        console.error("❌ API ERROR:", url, err.message);
        return null;
    }
}

/* =========================
   LOAD DASHBOARD
========================= */
async function loadDashboard() {

    const data = await api("/dashboard");

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

/* =========================
   LOAD RISK ANALYSIS
========================= */
async function loadRiskAnalysis() {

    const data = await api("/risk-analysis");

    if (!data) {
        document.getElementById("riskContainer").innerHTML =
            "<p style='color:red'>Failed to load risk analysis</p>";
        return;
    }

    let html = "<h3>⚠ Risk Analysis Engine</h3>";

    data.forEach(item => {

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

/* =========================
   LOGIN FUNCTION
========================= */
async function login(email, password) {

    try {
        const res = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Login failed");
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("tenantId", data.tenantId);

        window.location.href = "/dashboard.html";

    } catch (err) {
        console.error("Login error:", err);
        alert("Login failed");
    }
}

/* =========================
   SUBMIT INCIDENT
========================= */
async function submitIncident() {

    const location = document.getElementById("location").value;
    const severity = document.getElementById("severity").value;
    const msg = document.getElementById("msg");

    if (!location || !severity) {
        msg.innerHTML = "<span style='color:red'>All fields required</span>";
        return;
    }

    try {
        const res = await fetch("/add-incident", {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ location, severity })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed");
        }

        msg.innerHTML = "<span style='color:lightgreen'>✔ Incident submitted</span>";

        // Clear form
        document.getElementById("location").value = "";
        document.getElementById("severity").value = "";

    } catch (err) {
        console.error(err);
        msg.innerHTML = "<span style='color:red'>Submission failed</span>";
    }
}

/* =========================
   NAVIGATION
========================= */
function goDashboard() {
    window.location.href = "/dashboard.html";
}
/* =========================
   EXECUTIVE CHARTS
========================= */

let severityChart, riskChart;

async function loadCharts() {

    const dashboard = await api("/dashboard");
    const risks = await api("/risk-analysis");

    if (!dashboard || !risks) return;

    /* =====================
       PIE CHART (SEVERITY)
    ===================== */
    const ctx1 = document.getElementById("severityChart");

    if (ctx1) {
        if (severityChart) severityChart.destroy();

        severityChart = new Chart(ctx1, {
            type: "pie",
            data: {
                labels: ["High", "Medium", "Low"],
                datasets: [{
                    data: [
                        dashboard.high,
                        dashboard.medium,
                        dashboard.low
                    ]
                }]
            }
        });
    }

    /* =====================
       BAR CHART (RISK LEVELS)
    ===================== */
    const levelCounts = {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
    };

    risks.forEach(r => {
        if (levelCounts[r.level] !== undefined) {
            levelCounts[r.level]++;
        }
    });

    const ctx2 = document.getElementById("riskChart");

    if (ctx2) {
        if (riskChart) riskChart.destroy();

        riskChart = new Chart(ctx2, {
            type: "bar",
            data: {
                labels: ["HIGH", "MEDIUM", "LOW"],
                datasets: [{
                    label: "Risk Levels",
                    data: [
                        levelCounts.HIGH,
                        levelCounts.MEDIUM,
                        levelCounts.LOW
                    ]
                }]
            }
        });
    }
}
async function submitIncident(e) {
    e.preventDefault();

    const location = document.getElementById("location").value;
    const severity = document.getElementById("severity").value;

    const res = await api("/incidents", {
        method: "POST",
        body: JSON.stringify({ location, severity })
    });

    if (res) {
        alert("✅ Incident submitted");
        window.location.href = "/dashboard.html";
    }
}
/* =========================
   AUTO INIT
========================= */
async function init() {

    const path = window.location.pathname;

    if (path.includes("dashboard")) {
        await loadDashboard();
        await loadRiskAnalysis();
        await loadCharts(); // 👈 ADD THIS

        setInterval(() => {
            loadDashboard();
            loadRiskAnalysis();
            loadCharts(); // 👈 AUTO REFRESH
        }, 60000);
    }
}
// Start app
init();