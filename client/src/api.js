import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000/api",
});

// ==> Interceptor para adjuntar la clave admin si existe
api.interceptors.request.use((config) => {
  const adminKey = localStorage.getItem("adminKey");
  if (adminKey) config.headers["x-admin-key"] = adminKey;
  return config;
});
