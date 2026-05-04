export default function Navbar() {
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div style={{ padding: "10px", background: "#222", color: "#fff" }}>
      <span>NEXA OS</span>

      <button style={{ float: "right" }} onClick={logout}>
        Logout
      </button>
    </div>
  );
}