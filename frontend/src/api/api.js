import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
});

export const getFlights = () => API.get("/flights");
export const getAlerts = () => API.get("/alerts");
export const getRisk = () => API.get("/unified-risk");

export default API;