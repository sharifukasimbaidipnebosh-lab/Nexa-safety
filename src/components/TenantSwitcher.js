import { useState } from "react";

export default function TenantSwitcher() {
  const [tenant, setTenant] = useState(localStorage.getItem("tenant"));

  const switchTenant = (t) => {
    localStorage.setItem("tenant", t);
    setTenant(t);
    window.location.reload();
  };

  return (
    <div>
      <h4>Tenant: {tenant}</h4>
      <button onClick={() => switchTenant("airlineA")}>Airline A</button>
      <button onClick={() => switchTenant("airlineB")}>Airline B</button>
    </div>
  );
}