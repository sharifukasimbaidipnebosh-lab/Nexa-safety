const moment = require("moment");

exports.cleanData = (rows) => {
  return rows.map((r) => {
    const date = moment(r.Date).format("YYYY-MM-DD");

    let start = moment(`${date} ${r.Duty_Start_Time}`);
    let end = moment(`${date} ${r.Duty_End_Time}`);

    if (end.isBefore(start)) end.add(1, "day");

    const dutyHours = end.diff(start, "hours", true);

    return {
      ...r,
      flight_date: date,
      duty_hours: dutyHours,
      fatigue_flag: dutyHours > 12 || r.Rest_Hours_Before_Flight < 10,
      severity_score:
        r.Severity_Level === "High"
          ? 3
          : r.Severity_Level === "Medium"
          ? 2
          : 1,
    };
  });
};