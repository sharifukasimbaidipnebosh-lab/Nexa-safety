const API_URL = "http://localhost:5000/api";

// 🔐 helper to get token
const getToken = () => localStorage.getItem("token");

// =======================
// AUTH
// =======================
export const loginUser = async (data) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const registerUser = async (data) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return res.json();
};

// =======================
// 🔒 PROTECTED REQUEST
// =======================
export const fetchSecureData = async () => {
  const res = await fetch(`${API_URL}/secure/flights`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  return res.json();
};