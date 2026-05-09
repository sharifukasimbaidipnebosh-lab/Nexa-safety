import axios from "axios";

const API_URL = "http://localhost:5000";

export const getFlights = async () => {
  const res = await axios.get(`${API_URL}/api/flights`);
  return res.data.flights;
};