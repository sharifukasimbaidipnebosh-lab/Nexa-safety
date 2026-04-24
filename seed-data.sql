-- =============================================================
-- Nexa Safety — Seed Data
-- PostgreSQL 18
--
-- Usage (run after db-init.sql):
--   psql -U <user> -d nexa_safety -f seed-data.sql
--
-- Inserts sample records into the flights table with realistic
-- AI-generated risk predictions for development and testing.
-- =============================================================

\connect nexa_safety

-- ---------------------------------------------------------------
-- Flights — sample pilot fatigue & risk prediction records
-- ---------------------------------------------------------------
INSERT INTO flights (flight_number, date, pilot_name, duty_hours, rest_hours, risk_level, risk_score, prediction)
VALUES

-- Low-risk flight: well-rested pilot, short duty window
(
    'NX101',
    '2025-07-01',
    'Capt. Sarah Okonkwo',
    6.50,
    10.00,
    'LOW',
    1.20,
    '{
        "model": "nexa-fatigue-v1",
        "generated_at": "2025-07-01T06:00:00Z",
        "fatigue_probability": 0.08,
        "confidence": 0.94,
        "contributing_factors": ["adequate_rest", "short_duty_window"],
        "recommendation": "No intervention required. Continue standard monitoring.",
        "next_review": "2025-07-08"
    }'::jsonb
),

-- Medium-risk flight: moderate duty hours, borderline rest
(
    'NX204',
    '2025-07-02',
    'F/O James Whitfield',
    9.25,
    7.50,
    'MEDIUM',
    3.40,
    '{
        "model": "nexa-fatigue-v1",
        "generated_at": "2025-07-02T08:15:00Z",
        "fatigue_probability": 0.47,
        "confidence": 0.88,
        "contributing_factors": ["extended_duty_hours", "marginal_rest_period", "consecutive_early_starts"],
        "recommendation": "Schedule a mandatory rest break before next sector. Crew scheduling review advised.",
        "next_review": "2025-07-03"
    }'::jsonb
),

-- High-risk flight: excessive duty hours, insufficient rest
(
    'NX317',
    '2025-07-03',
    'Capt. Ravi Menon',
    13.75,
    5.00,
    'HIGH',
    7.80,
    '{
        "model": "nexa-fatigue-v1",
        "generated_at": "2025-07-03T04:30:00Z",
        "fatigue_probability": 0.83,
        "confidence": 0.91,
        "contributing_factors": ["excessive_duty_hours", "insufficient_rest", "night_shift_disruption", "multi_sector_rotation"],
        "recommendation": "Immediate crew replacement recommended. Pilot must not operate until minimum 10-hour rest is completed. Escalate to safety officer.",
        "next_review": "2025-07-04"
    }'::jsonb
),

-- Low-risk flight: experienced pilot, optimal rest
(
    'NX422',
    '2025-07-04',
    'Capt. Elena Vasquez',
    7.00,
    11.50,
    'LOW',
    0.95,
    '{
        "model": "nexa-fatigue-v1",
        "generated_at": "2025-07-04T09:00:00Z",
        "fatigue_probability": 0.05,
        "confidence": 0.97,
        "contributing_factors": ["optimal_rest", "regular_schedule"],
        "recommendation": "No intervention required. Pilot is well within safe operating parameters.",
        "next_review": "2025-07-11"
    }'::jsonb
),

-- Critical-risk flight: severe fatigue indicators
(
    'NX589',
    '2025-07-05',
    'F/O Daniel Osei',
    14.50,
    4.25,
    'CRITICAL',
    9.60,
    '{
        "model": "nexa-fatigue-v1",
        "generated_at": "2025-07-05T02:00:00Z",
        "fatigue_probability": 0.96,
        "confidence": 0.93,
        "contributing_factors": ["critical_duty_overage", "severe_sleep_deficit", "circadian_disruption", "back_to_back_long_haul", "timezone_crossing"],
        "recommendation": "CRITICAL: Ground crew immediately. Regulatory duty-time limits exceeded. Mandatory incident report required. Do not reinstate until full medical clearance and 24-hour rest.",
        "next_review": "2025-07-06"
    }'::jsonb
),

-- Medium-risk flight: timezone disruption after transatlantic
(
    'NX631',
    '2025-07-06',
    'Capt. Yuki Tanaka',
    8.75,
    8.00,
    'MEDIUM',
    4.10,
    '{
        "model": "nexa-fatigue-v1",
        "generated_at": "2025-07-06T11:30:00Z",
        "fatigue_probability": 0.52,
        "confidence": 0.85,
        "contributing_factors": ["transatlantic_recovery", "circadian_phase_shift", "moderate_duty_hours"],
        "recommendation": "Monitor closely during flight. Consider augmented crew for sectors exceeding 4 hours. Fatigue self-assessment required pre-departure.",
        "next_review": "2025-07-07"
    }'::jsonb
),

-- Low-risk flight: short turnaround domestic sector
(
    'NX745',
    '2025-07-07',
    'F/O Amara Diallo',
    4.25,
    12.00,
    'LOW',
    1.05,
    '{
        "model": "nexa-fatigue-v1",
        "generated_at": "2025-07-07T07:45:00Z",
        "fatigue_probability": 0.06,
        "confidence": 0.96,
        "contributing_factors": ["short_sector", "full_rest_period"],
        "recommendation": "No intervention required. Optimal fatigue profile for this duty period.",
        "next_review": "2025-07-14"
    }'::jsonb
),

-- High-risk flight: night departure after minimal rest
(
    'NX812',
    '2025-07-08',
    'Capt. Marcus Brennan',
    11.00,
    6.00,
    'HIGH',
    6.90,
    '{
        "model": "nexa-fatigue-v1",
        "generated_at": "2025-07-08T00:15:00Z",
        "fatigue_probability": 0.76,
        "confidence": 0.89,
        "contributing_factors": ["night_departure", "reduced_rest", "high_duty_hours", "window_of_circadian_low"],
        "recommendation": "Assign augmented crew. Conduct pre-flight fatigue assessment. Brief crew on fatigue countermeasures. Notify dispatcher of elevated risk status.",
        "next_review": "2025-07-09"
    }'::jsonb
);
