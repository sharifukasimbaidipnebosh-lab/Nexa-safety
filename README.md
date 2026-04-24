# Nexa Safety

A Node.js/Express safety management platform for aviation operations. Nexa Safety provides incident tracking, AI-generated corrective actions, pilot fatigue monitoring, and risk prediction — all backed by PostgreSQL 18.

---

## Stack

- **Runtime**: Node.js with Express
- **Database**: PostgreSQL 18
- **Deployment**: Railway

---

## Getting Started

### 1. Provision the database

```bash
psql -U <user> -f db-init.sql
```

### 2. Load sample data (optional)

```bash
psql -U <user> -d nexa_safety -f seed-data.sql
```

### 3. Configure environment

```bash
cp .env.example .env
# Set DATABASE_URL to your PostgreSQL connection string
```

### 4. Start the server

```bash
npm start
```

---

## Database Schema

### `users`

| Column     | Type    | Notes              |
|------------|---------|--------------------|
| id         | SERIAL  | Primary key        |
| email      | TEXT    | Unique             |
| password   | TEXT    |                    |
| tenantId   | TEXT    | Multi-tenant scope |

### `sessions`

| Column   | Type | Notes              |
|----------|------|--------------------|
| token    | TEXT | Primary key        |
| tenantId | TEXT | Multi-tenant scope |
| email    | TEXT |                    |

### `incidents`

| Column    | Type      | Notes              |
|-----------|-----------|--------------------|
| id        | SERIAL    | Primary key        |
| tenantId  | TEXT      | Multi-tenant scope |
| severity  | TEXT      | High / Medium / Low|
| location  | TEXT      |                    |
| createdAt | TIMESTAMP | Defaults to NOW()  |

### `actions`

| Column      | Type      | Notes                        |
|-------------|-----------|------------------------------|
| id          | SERIAL    | Primary key                  |
| tenantId    | TEXT      | Multi-tenant scope           |
| incident_id | INT       | References incidents.id      |
| action      | TEXT      | AI-generated corrective step |
| priority    | TEXT      | CRITICAL / HIGH / LOW        |
| status      | TEXT      | Defaults to OPEN             |
| created_at  | TIMESTAMP | Defaults to NOW()            |

### `recommendations`

| Column         | Type      | Notes                         |
|----------------|-----------|-------------------------------|
| id             | SERIAL    | Primary key                   |
| tenantId       | TEXT      | Multi-tenant scope            |
| incident_id    | INT       | References incidents.id       |
| risk_level     | TEXT      | HIGH / MEDIUM / LOW           |
| recommendation | TEXT      | AI-generated recommendation   |
| root_cause     | TEXT      | AI-identified root cause      |
| created_at     | TIMESTAMP | Defaults to NOW()             |

### `flight_data`

Legacy pilot fatigue table. Tracks duty hours, fatigue flags, and scalar risk scores per flight.

| Column        | Type         | Notes                  |
|---------------|--------------|------------------------|
| id            | SERIAL       | Primary key            |
| flight_number | TEXT         |                        |
| flight_date   | DATE         |                        |
| pilot_name    | TEXT         |                        |
| duty_hours    | NUMERIC(5,2) |                        |
| fatigue_flag  | BOOLEAN      | Defaults to FALSE      |
| severity_score| NUMERIC(4,2) |                        |
| risk_score    | NUMERIC(4,2) |                        |
| risk_level    | TEXT         |                        |
| created_at    | TIMESTAMP    | Defaults to NOW()      |

### `flights`

Enhanced pilot fatigue monitoring table with rest-hour tracking and AI-generated risk predictions stored as JSONB. Use this table for advanced fatigue analysis and trend reporting.

| Column        | Type         | Notes                                        |
|---------------|--------------|----------------------------------------------|
| id            | SERIAL       | Primary key                                  |
| flight_number | TEXT         | IATA/ICAO flight identifier                  |
| date          | DATE         | Scheduled departure date                     |
| pilot_name    | TEXT         | Full name of the operating pilot             |
| duty_hours    | NUMERIC(5,2) | Total duty period in hours                   |
| rest_hours    | NUMERIC(5,2) | Rest period preceding this duty in hours     |
| risk_level    | TEXT         | LOW / MEDIUM / HIGH / CRITICAL               |
| risk_score    | NUMERIC(4,2) | Composite fatigue risk score (0.00 – 10.00)  |
| prediction    | JSONB        | AI risk prediction payload (see below)       |
| created_at    | TIMESTAMP    | Defaults to NOW()                            |

#### `prediction` JSONB structure

The `prediction` column stores the full output of the Nexa fatigue AI model. All fields are written at assessment time and are immutable after insertion.

```json
{
  "model": "nexa-fatigue-v1",
  "generated_at": "2025-07-03T04:30:00Z",
  "fatigue_probability": 0.83,
  "confidence": 0.91,
  "contributing_factors": [
    "excessive_duty_hours",
    "insufficient_rest",
    "night_shift_disruption",
    "multi_sector_rotation"
  ],
  "recommendation": "Immediate crew replacement recommended. Pilot must not operate until minimum 10-hour rest is completed. Escalate to safety officer.",
  "next_review": "2025-07-04"
}
```

| Field                 | Type             | Description                                                  |
|-----------------------|------------------|--------------------------------------------------------------|
| model                 | string           | Model version that produced this prediction                  |
| generated_at          | ISO 8601 string  | UTC timestamp of prediction generation                       |
| fatigue_probability   | float (0–1)      | Probability that the pilot is fatigued                       |
| confidence            | float (0–1)      | Model confidence in the prediction                           |
| contributing_factors  | string[]         | Factors that elevated the risk score                         |
| recommendation        | string           | Operational guidance for crew scheduling / safety officers   |
| next_review           | ISO 8601 date    | Earliest date for the next fatigue reassessment              |

#### Risk level thresholds

| risk_score range | risk_level |
|------------------|------------|
| 0.00 – 2.49      | LOW        |
| 2.50 – 4.99      | MEDIUM     |
| 5.00 – 7.99      | HIGH       |
| 8.00 – 10.00     | CRITICAL   |

#### Useful queries

```sql
-- All high or critical flights in the last 7 days
SELECT flight_number, pilot_name, risk_level, risk_score,
       prediction->>'recommendation' AS recommendation
FROM flights
WHERE risk_level IN ('HIGH', 'CRITICAL')
  AND date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY risk_score DESC;

-- Average fatigue probability per pilot
SELECT pilot_name,
       ROUND(AVG((prediction->>'fatigue_probability')::numeric), 3) AS avg_fatigue_prob,
       COUNT(*) AS flights
FROM flights
GROUP BY pilot_name
ORDER BY avg_fatigue_prob DESC;

-- Flights where a specific contributing factor was present
SELECT flight_number, date, pilot_name, risk_score
FROM flights
WHERE prediction->'contributing_factors' ? 'night_shift_disruption'
ORDER BY date DESC;
```

---

## API Endpoints

All protected routes require an `Authorization` header containing a valid session token obtained from `POST /login`.

| Method | Path              | Auth | Description                              |
|--------|-------------------|------|------------------------------------------|
| POST   | /register         | No   | Create a new user account                |
| POST   | /login            | No   | Authenticate and receive a session token |
| GET    | /incidents        | Yes  | List all incidents for the tenant        |
| POST   | /incidents        | Yes  | Create incident + AI action + AI rec     |
| PUT    | /incidents/:id    | Yes  | Update an incident                       |
| DELETE | /incidents/:id    | Yes  | Delete an incident                       |
| GET    | /actions          | Yes  | List all actions for the tenant          |
| PUT    | /actions/:id      | Yes  | Update action status                     |
| GET    | /recommendations  | Yes  | List all recommendations for the tenant  |
| GET    | /dashboard        | Yes  | Incident summary counts                  |
| GET    | /predict-risk     | Yes  | AI risk trend by location                |
| GET    | /health           | No   | Liveness check                           |
