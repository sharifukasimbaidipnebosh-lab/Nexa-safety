import { useState } from "react";
import { registerUser } from "../api/api";

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    tenantName: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = await registerUser(form);

    if (data.token) {
      localStorage.setItem("token", data.token);
      alert("Account created 🚀");
      window.location.href = "/dashboard";
    } else {
      alert(data.message || "Signup failed");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Create Account</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Airline Name"
          onChange={(e) =>
            setForm({ ...form, tenantName: e.target.value })
          }
        />

        <input
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button type="submit">Register</button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    width: "300px",
    margin: "100px auto",
    textAlign: "center"
  }
};