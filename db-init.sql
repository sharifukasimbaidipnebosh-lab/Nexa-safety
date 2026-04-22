-- =============================================================
-- Nexa Safety — Database Initialisation Script
-- PostgreSQL 18
--
-- Usage (run once against your PostgreSQL instance):
--   psql -U <user> -f db-init.sql
--
-- On Railway the nexa_safety database is created via the
-- Railway Postgres plugin. Set DATABASE_URL to point at it
-- (see .env.example) and the application will create all
-- tables automatically on first boot via initDB() in server.js.
-- =============================================================

-- Create the database (skip if it already exists).
-- NOTE: CREATE DATABASE cannot run inside a transaction block,
-- so connect to the default 'postgres' database first.
SELECT 'CREATE DATABASE nexa_safety'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'nexa_safety'
)\gexec

-- Switch to the nexa_safety database before creating tables.
\connect nexa_safety

-- ---------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id        SERIAL PRIMARY KEY,
    email     TEXT UNIQUE,
    password  TEXT,
    "tenantId" TEXT
);

-- ---------------------------------------------------------------
-- Sessions
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    "tenantId" TEXT,
    email      TEXT
);

-- ---------------------------------------------------------------
-- Incidents
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incidents (
    id         SERIAL PRIMARY KEY,
    "tenantId" TEXT,
    severity   TEXT,
    location   TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- Actions
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS actions (
    id          SERIAL PRIMARY KEY,
    "tenantId"  TEXT,
    incident_id INT,
    action      TEXT,
    priority    TEXT,
    status      TEXT DEFAULT 'OPEN',
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- Recommendations
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendations (
    id             SERIAL PRIMARY KEY,
    "tenantId"     TEXT,
    incident_id    INT,
    risk_level     TEXT,
    recommendation TEXT,
    root_cause     TEXT,
    created_at     TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- Flight Data  (pilot fatigue monitoring & risk assessment)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flight_data (
    id             SERIAL PRIMARY KEY,
    flight_number  TEXT           NOT NULL,
    flight_date    DATE           NOT NULL,
    pilot_name     TEXT           NOT NULL,
    duty_hours     NUMERIC(5, 2)  NOT NULL,
    fatigue_flag   BOOLEAN        DEFAULT FALSE,
    severity_score NUMERIC(4, 2),
    risk_score     NUMERIC(4, 2),
    risk_level     TEXT,
    created_at     TIMESTAMP      DEFAULT NOW()
);
