import axios from "axios";

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || "http://localhost:4000/api",
});

// Adjunta token si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si 401 → redirigir a login admin
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const st = err?.response?.status;
    if (st === 401) {
      // opcional: limpiar token
      localStorage.removeItem("adminToken");
      if (window.location.pathname !== "/admin-login") {
        window.location.href = "/admin-login";
      }
    }
    return Promise.reject(err);
  }
);
