-- =============================================================
-- Nexa Safety — Sample Seed Data
-- PostgreSQL 18
--
-- Usage:
--   psql "$DATABASE_URL" -f seed-data.sql
--
-- This script is idempotent: it uses ON CONFLICT DO NOTHING for
-- users and clears then re-inserts all other rows so it can be
-- re-run safely during development.
--
-- Tenant IDs used:
--   TENANT_ALPHA  — primary demo tenant
--   TENANT_BETA   — secondary demo tenant (multi-tenancy test)
-- =============================================================

-- ---------------------------------------------------------------
-- Users  (passwords stored as plain text — dev only, never prod)
-- ---------------------------------------------------------------
INSERT INTO users (email, password, "tenantId") VALUES
    ('admin@alpha.com',   'admin123',    'TENANT_ALPHA'),
    ('ops@alpha.com',     'ops123',      'TENANT_ALPHA'),
    ('safety@alpha.com',  'safety123',   'TENANT_ALPHA'),
    ('admin@beta.com',    'admin123',    'TENANT_BETA'),
    ('pilot@beta.com',    'pilot123',    'TENANT_BETA')
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------
-- Incidents
-- ---------------------------------------------------------------
-- Clear existing seed incidents to avoid duplicates on re-run.
DELETE FROM incidents
WHERE "tenantId" IN ('TENANT_ALPHA', 'TENANT_BETA');

INSERT INTO incidents ("tenantId", severity, location, "createdAt") VALUES
    -- TENANT_ALPHA
    ('TENANT_ALPHA', 'High',   'Runway 09L',          NOW() - INTERVAL '30 days'),
    ('TENANT_ALPHA', 'High',   'Terminal Gate B7',    NOW() - INTERVAL '25 days'),
    ('TENANT_ALPHA', 'Medium', 'Taxiway Delta',       NOW() - INTERVAL '20 days'),
    ('TENANT_ALPHA', 'Medium', 'Hangar 3',            NOW() - INTERVAL '18 days'),
    ('TENANT_ALPHA', 'Medium', 'Fuel Station Alpha',  NOW() - INTERVAL '15 days'),
    ('TENANT_ALPHA', 'Low',    'Cargo Bay 2',         NOW() - INTERVAL '12 days'),
    ('TENANT_ALPHA', 'Low',    'Control Tower',       NOW() - INTERVAL '10 days'),
    ('TENANT_ALPHA', 'High',   'Runway 27R',          NOW() - INTERVAL '7 days'),
    ('TENANT_ALPHA', 'Medium', 'Apron North',         NOW() - INTERVAL '5 days'),
    ('TENANT_ALPHA', 'Low',    'Maintenance Bay 1',   NOW() - INTERVAL '2 days'),
    -- TENANT_BETA
    ('TENANT_BETA',  'High',   'Runway 18',           NOW() - INTERVAL '22 days'),
    ('TENANT_BETA',  'Medium', 'Terminal A Gate 3',   NOW() - INTERVAL '14 days'),
    ('TENANT_BETA',  'Low',    'Baggage Hall',        NOW() - INTERVAL '6 days');

-- ---------------------------------------------------------------
-- Actions  (linked to incidents by relative position)
-- ---------------------------------------------------------------
DELETE FROM actions
WHERE "tenantId" IN ('TENANT_ALPHA', 'TENANT_BETA');

-- Re-insert actions referencing the incidents we just created.
-- We use a sub-select to resolve incident IDs dynamically.
INSERT INTO actions ("tenantId", incident_id, action, priority, status, created_at)
SELECT
    i."tenantId",
    i.id,
    a.action,
    a.priority,
    a.status,
    NOW() - a.offset
FROM (
    VALUES
        -- Runway 09L (High)
        ('TENANT_ALPHA', 'Runway 09L',         'Immediate FOD inspection and runway closure',          'CRITICAL', 'CLOSED',  INTERVAL '29 days'),
        ('TENANT_ALPHA', 'Runway 09L',         'Notify ATC and issue NOTAM',                           'CRITICAL', 'CLOSED',  INTERVAL '29 days'),
        -- Terminal Gate B7 (High)
        ('TENANT_ALPHA', 'Terminal Gate B7',   'Evacuate gate area and secure perimeter',              'CRITICAL', 'CLOSED',  INTERVAL '24 days'),
        ('TENANT_ALPHA', 'Terminal Gate B7',   'Conduct structural integrity assessment',              'HIGH',     'CLOSED',  INTERVAL '23 days'),
        -- Taxiway Delta (Medium)
        ('TENANT_ALPHA', 'Taxiway Delta',      'Safety inspection and ground crew retraining',         'HIGH',     'OPEN',    INTERVAL '19 days'),
        -- Hangar 3 (Medium)
        ('TENANT_ALPHA', 'Hangar 3',           'Fire suppression system check',                        'HIGH',     'OPEN',    INTERVAL '17 days'),
        -- Fuel Station Alpha (Medium)
        ('TENANT_ALPHA', 'Fuel Station Alpha', 'Fuel leak containment and spill cleanup',              'HIGH',     'OPEN',    INTERVAL '14 days'),
        -- Cargo Bay 2 (Low)
        ('TENANT_ALPHA', 'Cargo Bay 2',        'Monitor cargo securing procedures',                    'LOW',      'OPEN',    INTERVAL '11 days'),
        -- Control Tower (Low)
        ('TENANT_ALPHA', 'Control Tower',      'Review communication logs',                            'LOW',      'OPEN',    INTERVAL '9 days'),
        -- Runway 27R (High)
        ('TENANT_ALPHA', 'Runway 27R',         'Emergency runway inspection — bird strike reported',   'CRITICAL', 'OPEN',    INTERVAL '6 days'),
        ('TENANT_ALPHA', 'Runway 27R',         'Deploy bird dispersal team',                           'HIGH',     'OPEN',    INTERVAL '6 days'),
        -- Apron North (Medium)
        ('TENANT_ALPHA', 'Apron North',        'Ground vehicle speed audit',                           'HIGH',     'OPEN',    INTERVAL '4 days'),
        -- Maintenance Bay 1 (Low)
        ('TENANT_ALPHA', 'Maintenance Bay 1',  'Schedule routine safety walkthrough',                  'LOW',      'OPEN',    INTERVAL '1 day'),
        -- TENANT_BETA
        ('TENANT_BETA',  'Runway 18',          'Immediate runway inspection and closure',              'CRITICAL', 'CLOSED',  INTERVAL '21 days'),
        ('TENANT_BETA',  'Terminal A Gate 3',  'Inspect gate jetway and report findings',              'HIGH',     'OPEN',    INTERVAL '13 days'),
        ('TENANT_BETA',  'Baggage Hall',        'Monitor baggage handling equipment',                  'LOW',      'OPEN',    INTERVAL '5 days')
) AS a(tenant, location, action, priority, status, offset)
JOIN incidents i
    ON i."tenantId" = a.tenant
   AND i.location   = a.location;

-- ---------------------------------------------------------------
-- Recommendations
-- ---------------------------------------------------------------
DELETE FROM recommendations
WHERE "tenantId" IN ('TENANT_ALPHA', 'TENANT_BETA');

INSERT INTO recommendations ("tenantId", incident_id, risk_level, recommendation, root_cause, created_at)
SELECT
    i."tenantId",
    i.id,
    r.risk_level,
    r.recommendation,
    r.root_cause,
    NOW() - r.offset
FROM (
    VALUES
        ('TENANT_ALPHA', 'Runway 09L',         'HIGH',   'Stop operation immediately and investigate',                    'Foreign object debris — inadequate pre-flight runway sweep',          INTERVAL '29 days'),
        ('TENANT_ALPHA', 'Terminal Gate B7',   'HIGH',   'Stop operation immediately and investigate',                    'Critical structural fault — deferred maintenance',                    INTERVAL '24 days'),
        ('TENANT_ALPHA', 'Taxiway Delta',      'MEDIUM', 'Inspect and retrain ground crew on taxiway procedures',         'Human factors — procedural non-compliance',                           INTERVAL '19 days'),
        ('TENANT_ALPHA', 'Hangar 3',           'MEDIUM', 'Service fire suppression system and update inspection log',     'Equipment ageing — missed scheduled maintenance',                     INTERVAL '17 days'),
        ('TENANT_ALPHA', 'Fuel Station Alpha', 'MEDIUM', 'Inspect fuel lines and update spill response plan',             'Worn fuel coupling — inadequate equipment lifecycle management',      INTERVAL '14 days'),
        ('TENANT_ALPHA', 'Cargo Bay 2',        'LOW',    'Monitor trend and review cargo securing checklist',             'Minor procedural gap — low risk at current frequency',                INTERVAL '11 days'),
        ('TENANT_ALPHA', 'Control Tower',      'LOW',    'Monitor communication logs for recurring anomalies',            'Minor issue — isolated communication delay',                          INTERVAL '9 days'),
        ('TENANT_ALPHA', 'Runway 27R',         'HIGH',   'Stop operation immediately and deploy wildlife management team', 'Bird strike — insufficient wildlife hazard mitigation programme',     INTERVAL '6 days'),
        ('TENANT_ALPHA', 'Apron North',        'MEDIUM', 'Enforce apron speed limits and conduct vehicle operator audit', 'Human factors — ground vehicle speed non-compliance',                 INTERVAL '4 days'),
        ('TENANT_ALPHA', 'Maintenance Bay 1',  'LOW',    'Monitor trend and schedule next walkthrough within 30 days',    'Minor issue — routine observation',                                   INTERVAL '1 day'),
        ('TENANT_BETA',  'Runway 18',          'HIGH',   'Stop operation immediately and investigate',                    'Critical runway surface defect — deferred resurfacing',               INTERVAL '21 days'),
        ('TENANT_BETA',  'Terminal A Gate 3',  'MEDIUM', 'Inspect jetway mechanism and retrain gate agents',              'Human factors — improper docking procedure',                          INTERVAL '13 days'),
        ('TENANT_BETA',  'Baggage Hall',       'LOW',    'Monitor baggage belt equipment and schedule next service',      'Minor issue — isolated belt slowdown',                                INTERVAL '5 days')
) AS r(tenant, location, risk_level, recommendation, root_cause, offset)
JOIN incidents i
    ON i."tenantId" = r.tenant
   AND i.location   = r.location;

-- ---------------------------------------------------------------
-- Flight Data  (pilot fatigue monitoring)
-- ---------------------------------------------------------------
DELETE FROM flight_data;

INSERT INTO flight_data
    (flight_number, flight_date, pilot_name, duty_hours, fatigue_flag, severity_score, risk_score, risk_level)
VALUES
    -- Normal duty hours (≤ 10 h)
    ('NX101', CURRENT_DATE - 29, 'Capt. Sarah Mitchell',  8.50, FALSE, 1.20, 1.50, 'LOW'),
    ('NX102', CURRENT_DATE - 28, 'F/O James Okafor',      7.75, FALSE, 0.90, 1.10, 'LOW'),
    ('NX103', CURRENT_DATE - 27, 'Capt. Priya Sharma',    9.00, FALSE, 1.50, 1.80, 'LOW'),
    ('NX104', CURRENT_DATE - 26, 'F/O Daniel Reyes',      6.50, FALSE, 0.70, 0.90, 'LOW'),
    ('NX105', CURRENT_DATE - 25, 'Capt. Lena Hoffmann',   9.50, FALSE, 1.80, 2.10, 'LOW'),

    -- Elevated duty hours (10–12 h) — medium risk
    ('NX201', CURRENT_DATE - 20, 'Capt. Sarah Mitchell', 11.00, FALSE, 3.50, 4.20, 'MEDIUM'),
    ('NX202', CURRENT_DATE - 19, 'F/O James Okafor',     10.75, FALSE, 3.20, 3.90, 'MEDIUM'),
    ('NX203', CURRENT_DATE - 18, 'Capt. Marcus Webb',    11.50, FALSE, 3.80, 4.50, 'MEDIUM'),
    ('NX204', CURRENT_DATE - 17, 'F/O Aisha Nkosi',      10.25, FALSE, 3.00, 3.60, 'MEDIUM'),
    ('NX205', CURRENT_DATE - 16, 'Capt. Priya Sharma',   11.75, FALSE, 4.00, 4.70, 'MEDIUM'),

    -- High duty hours (> 12 h) — fatigue flagged
    ('NX301', CURRENT_DATE - 10, 'Capt. Marcus Webb',    13.50, TRUE,  6.80, 7.50, 'HIGH'),
    ('NX302', CURRENT_DATE -  9, 'F/O Aisha Nkosi',      12.25, TRUE,  5.50, 6.20, 'HIGH'),
    ('NX303', CURRENT_DATE -  8, 'Capt. Lena Hoffmann',  14.00, TRUE,  7.20, 8.10, 'HIGH'),
    ('NX304', CURRENT_DATE -  7, 'Capt. Sarah Mitchell', 13.00, TRUE,  6.50, 7.20, 'HIGH'),
    ('NX305', CURRENT_DATE -  6, 'F/O Daniel Reyes',     12.75, TRUE,  6.00, 6.80, 'HIGH'),

    -- Critical duty hours (> 14 h) — severe fatigue
    ('NX401', CURRENT_DATE -  4, 'Capt. Marcus Webb',    15.50, TRUE,  8.90, 9.40, 'CRITICAL'),
    ('NX402', CURRENT_DATE -  3, 'Capt. Priya Sharma',   14.75, TRUE,  8.20, 8.80, 'CRITICAL'),
    ('NX403', CURRENT_DATE -  2, 'F/O James Okafor',     16.00, TRUE,  9.50, 9.80, 'CRITICAL'),

    -- Recent / today
    ('NX501', CURRENT_DATE -  1, 'Capt. Lena Hoffmann',   9.25, FALSE, 1.60, 1.90, 'LOW'),
    ('NX502', CURRENT_DATE,      'F/O Aisha Nkosi',        8.00, FALSE, 1.10, 1.30, 'LOW');
