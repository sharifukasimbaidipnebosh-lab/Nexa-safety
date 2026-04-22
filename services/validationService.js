exports.validateRow = (r) => {
  if (!r.Flight_Number) return "Missing Flight Number";
  if (!r.Date) return "Missing Date";
  return null;
};