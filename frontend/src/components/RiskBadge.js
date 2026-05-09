import React from "react";

const RiskBadge = ({ risk }) => {
  let color = "green";

  if (risk === "MEDIUM") color = "orange";
  if (risk === "HIGH") color = "red";

  return (
    <span
      style={{
        padding: "5px 10px",
        backgroundColor: color,
        color: "white",
        borderRadius: "5px",
        fontWeight: "bold",
      }}
    >
      {risk || "LOW"}
    </span>
  );
};

export default RiskBadge;