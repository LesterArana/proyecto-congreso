import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const k = localStorage.getItem("adminKey");
  if (k) config.headers["x-admin-key"] = k;
  return config;
});
