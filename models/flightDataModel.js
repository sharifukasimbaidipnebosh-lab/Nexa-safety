const db = require("../config/db");

exports.insertFlightData = async (rows) => {
  for (let r of rows) {
    await db.query(
      `INSERT INTO flight_data 
      (flight_number, flight_date, pilot_name, duty_hours, fatigue_flag, severity_score, risk_score, risk_level)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        r.Flight_Number,
        r.flight_date,
        r.Pilot_Name,
        r.duty_hours,
        r.fatigue_flag,
        r.severity_score,
        r.risk_score,
        r.risk_level,
      ]
    );
  }
};