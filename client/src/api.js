import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000/api",
});

// ==> Interceptor para adjuntar la clave admin si existe

api.interceptors.request.use((config) => {
  const k = localStorage.getItem("adminKey");
  if (k) config.headers["x-admin-key"] = k; // 👈 manda la clave en TODAS las llamadas
  return config;
});