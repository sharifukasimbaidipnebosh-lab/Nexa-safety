# ✈️ Nexa Safety

AI-powered aviation safety management platform. Tracks incidents, generates automated actions and recommendations, monitors pilot fatigue via flight data, and surfaces predictive risk trends — all through a multi-tenant REST API backed by PostgreSQL.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running Locally](#running-locally)
- [Connecting to the Database](#connecting-to-the-database)
- [Loading Sample Data](#loading-sample-data)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Flight Data Schema](#flight-data-schema)
- [Database Schema](#database-schema)
- [Deploying to Railway](#deploying-to-railway)

---

## Quick Start

```bash
# Clone the repo
git clone <repo-url>
cd nexa-safety

# Run the automated setup (installs psql, npm deps, creates .env)
chmod +x setup.sh && ./setup.sh          # macOS / Linux
# setup.bat                              # Windows

# Edit .env with your DATABASE_URL, then start
npm start
```

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| npm | ≥ 9 | Ships with Node.js |
| PostgreSQL client (`psql`) | ≥ 14 | Only needed for manual DB operations |
| PostgreSQL server | 18 | Provided by Railway in production |

---

## Setup

### Automated (recommended)

The setup scripts handle everything: checking Node.js/npm, installing `psql` via your system package manager, running `npm install`, and creating `.env` from `.env.example`.

**macOS / Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

**Windows:**
```bat
setup.bat
```

### Manual

```bash
# 1. Install npm dependencies
npm install

# 2. Create your .env file
cp .env.example .env

# 3. Edit .env — set DATABASE_URL to your PostgreSQL connection string
```

---

## Running Locally

```bash
npm start
```

The server starts on `http://localhost:3000` (or the port set in `.env`).

On first boot, `initDB()` automatically creates all required tables if they do not exist — no manual migration step needed.

To verify the server is running:
```bash
curl http://localhost:3000/health
# {"status":"OK","uptime":3.14}
```

---

## Connecting to the Database

### Interactive psql session

```bash
# Using the DATABASE_URL from your .env
psql "$DATABASE_URL"

# Or with explicit parameters
psql -h <host> -p <port> -U <user> -d <database>
```

### Initialise schema manually

The server auto-creates tables on boot, but you can also run the SQL script directly:

```bash
psql "$DATABASE_URL" -f db-init.sql
```

### Railway database

1. Open your Railway project → **Postgres** plugin → **Connect** tab.
2. Copy the **DATABASE_URL** (public URL).
3. Paste it into your local `.env` as `DATABASE_URL`.
4. Connect:
   ```bash
   psql "$DATABASE_URL"
   ```

---

## Loading Sample Data

The `seed-data.sql` script inserts realistic sample records across all tables — useful for local development and UI testing.

```bash
psql "$DATABASE_URL" -f seed-data.sql
```

**What gets seeded:**

| Table | Records | Details |
|-------|---------|---------|
| `users` | 5 | Two tenants: `TENANT_ALPHA` (3 users) and `TENANT_BETA` (2 users) |
| `incidents` | 13 | Mix of High / Medium / Low severity across multiple locations |
| `actions` | 16 | Linked to incidents; mix of OPEN and CLOSED statuses |
| `recommendations` | 13 | AI-generated root causes and recommendations per incident |
| `flight_data` | 20 | Covers LOW → CRITICAL fatigue risk levels across 5 pilots |

**Demo credentials (seed users):**

| Email | Password | Tenant |
|-------|----------|--------|
| `admin@alpha.com` | `admin123` | `TENANT_ALPHA` |
| `ops@alpha.com` | `ops123` | `TENANT_ALPHA` |
| `safety@alpha.com` | `safety123` | `TENANT_ALPHA` |
| `admin@beta.com` | `admin123` | `TENANT_BETA` |
| `pilot@beta.com` | `pilot123` | `TENANT_BETA` |

> **Warning:** Seed passwords are plain text and for development only. Never use this data in production.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string. Railway injects this automatically. |
| `PORT` | ❌ | `3000` | Port the Express server listens on. |
| `NODE_ENV` | ❌ | `development` | Set to `production` to enable SSL on the DB connection. |

---

## API Reference

All protected endpoints require an `Authorization` header containing the session token returned by `/login`.

```
Authorization: <token>
```

### Authentication

#### `POST /register`
Create a new user account.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "secret",
  "tenantId": "TENANT_ALPHA"
}
```

**Response `200`:**
```json
{ "message": "User created" }
```

---

#### `POST /login`
Authenticate and receive a session token.

**Body:**
```json
{
  "email": "admin@alpha.com",
  "password": "admin123"
}
```

**Response `200`:**
```json
{
  "token": "a3f9c2...",
  "tenantId": "TENANT_ALPHA"
}
```

---

### Incidents

#### `GET /incidents` 🔒
List all incidents for the authenticated tenant, newest first.

**Response `200`:**
```json
[
  {
    "id": 1,
    "tenantId": "TENANT_ALPHA",
    "severity": "High",
    "location": "Runway 09L",
    "createdAt": "2025-01-01T10:00:00.000Z"
  }
]
```

---

#### `POST /incidents` 🔒
Create a new incident. Automatically generates an AI action and recommendation.

**Body:**
```json
{
  "location": "Runway 09L",
  "severity": "High"
}
```

**Response `200`:**
```json
{
  "message": "Incident + AI generated",
  "action": {
    "action": "Immediate investigation at Runway 09L",
    "priority": "CRITICAL"
  },
  "recommendation": {
    "recommendation": "Stop operation immediately and investigate",
    "rootCause": "Critical unsafe condition",
    "priority": "HIGH"
  }
}
```

---

#### `PUT /incidents/:id` 🔒
Update an existing incident.

**Body:**
```json
{
  "location": "Runway 27R",
  "severity": "Medium"
}
```

**Response `200`:**
```json
{ "message": "Updated" }
```

---

#### `DELETE /incidents/:id` 🔒
Delete an incident.

**Response `200`:**
```json
{ "message": "Deleted" }
```

---

### Actions

#### `GET /actions` 🔒
List all actions for the authenticated tenant, newest first.

**Response `200`:**
```json
[
  {
    "id": 1,
    "tenantId": "TENANT_ALPHA",
    "incident_id": 1,
    "action": "Immediate investigation at Runway 09L",
    "priority": "CRITICAL",
    "status": "OPEN",
    "created_at": "2025-01-01T10:00:00.000Z"
  }
]
```

---

#### `PUT /actions/:id` 🔒
Update the status of an action (e.g. close it).

**Body:**
```json
{ "status": "CLOSED" }
```

**Response `200`:**
```json
{ "message": "Action updated" }
```

---

### Recommendations

#### `GET /recommendations` 🔒
List all AI-generated recommendations for the authenticated tenant.

**Response `200`:**
```json
[
  {
    "id": 1,
    "tenantId": "TENANT_ALPHA",
    "incident_id": 1,
    "risk_level": "HIGH",
    "recommendation": "Stop operation immediately and investigate",
    "root_cause": "Critical unsafe condition",
    "created_at": "2025-01-01T10:00:00.000Z"
  }
]
```

---

### Dashboard & Analytics

#### `GET /dashboard` 🔒
Returns incident counts grouped by severity for the authenticated tenant.

**Response `200`:**
```json
{
  "total": 10,
  "high": 3,
  "medium": 4,
  "low": 3
}
```

---

#### `GET /predict-risk` 🔒
Returns AI-generated risk trend predictions per location.

**Response `200`:**
```json
[
  {
    "location": "Runway 09L",
    "riskScore": "4.50",
    "trend": "HIGH",
    "probability": "90%"
  }
]
```

**Trend levels:** `LOW` · `MEDIUM` · `HIGH` · `CRITICAL`

---

### Health

#### `GET /health`
Public health check. No authentication required.

**Response `200`:**
```json
{ "status": "OK", "uptime": 42.3 }
```

---

## Flight Data Schema

The `flight_data` table stores pilot duty-hour records used for fatigue monitoring and risk assessment.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `SERIAL` | Auto-incrementing primary key |
| `flight_number` | `TEXT` | ICAO/IATA flight identifier (e.g. `NX101`) |
| `flight_date` | `DATE` | Date of the flight |
| `pilot_name` | `TEXT` | Full name of the pilot in command or first officer |
| `duty_hours` | `NUMERIC(5,2)` | Total duty hours for the flight day |
| `fatigue_flag` | `BOOLEAN` | `TRUE` when duty hours exceed the fatigue threshold (> 12 h) |
| `severity_score` | `NUMERIC(4,2)` | Computed severity index (0–10 scale) |
| `risk_score` | `NUMERIC(4,2)` | Computed overall risk score (0–10 scale) |
| `risk_level` | `TEXT` | Categorical risk: `LOW` · `MEDIUM` · `HIGH` · `CRITICAL` |
| `created_at` | `TIMESTAMP` | Record creation timestamp (defaults to `NOW()`) |

**Risk level thresholds (duty hours):**

| Duty Hours | Risk Level | Fatigue Flag |
|------------|------------|--------------|
| ≤ 10 h | `LOW` | `FALSE` |
| 10 – 12 h | `MEDIUM` | `FALSE` |
| 12 – 14 h | `HIGH` | `TRUE` |
| > 14 h | `CRITICAL` | `TRUE` |

---

## Database Schema

All tables are created automatically by `initDB()` on server startup, or manually via `db-init.sql`.

```
users            — accounts (email, password, tenantId)
sessions         — active session tokens
incidents        — safety incidents (severity, location, tenantId)
actions          — AI-generated corrective actions per incident
recommendations  — AI-generated risk recommendations per incident
flight_data      — pilot duty hours and fatigue risk records
```

Multi-tenancy is enforced at the query level: every protected endpoint filters by `tenantId` extracted from the authenticated session.

---

## Deploying to Railway

1. Push this repository to GitHub.
2. Create a new Railway project → **Deploy from GitHub repo**.
3. Add a **PostgreSQL** plugin to the project.
4. Railway automatically injects `DATABASE_URL` and `PORT` — no manual configuration needed.
5. The server will start, connect to Postgres, and run `initDB()` to create all tables.

To seed the Railway database from your local machine:

```bash
# Copy DATABASE_URL from Railway → Postgres → Connect tab
export DATABASE_URL="postgresql://postgres:<password>@<host>:<port>/railway"
psql "$DATABASE_URL" -f seed-data.sql
```
