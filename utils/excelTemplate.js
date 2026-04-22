const XLSX = require("xlsx");

exports.generateTemplate = (path) => {
  const data = [
    {
      Flight_Number: "",
      Date: "",
      Pilot_Name: "",
      Duty_Start_Time: "",
      Duty_End_Time: "",
      Rest_Hours_Before_Flight: "",
      Incident_Type: "",
      Severity_Level: "",
      Crew_Feedback: "",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");

  XLSX.writeFile(wb, path);
};