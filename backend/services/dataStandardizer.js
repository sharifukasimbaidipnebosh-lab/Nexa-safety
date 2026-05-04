function standardizeFlightData(row) {
  return {
    flight_number: (row.Flight_Number || "").toUpperCase(),
    date: new Date(row.Date).toISOString().split("T")[0],
    pilot_name: row.Pilot_Name,
    duty_start_time: row.Duty_Start_Time,
    duty_end_time: row.Duty_End_Time,
    rest_hours_before_flight: parseFloat(row.Rest_Hours_Before_Flight || 0),
    incident_type: row.Incident_Type,
    severity_level: (row.Severity_Level || "LOW").toUpperCase(),
    crew_feedback: row.Crew_Feedback,
  };
}

module.exports = { standardizeFlightData };