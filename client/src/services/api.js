import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
});

// ✅ Attach token to EVERY request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle errors
api.interceptors.response.use(
  (response) => response,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // ✅ Always show backend message
    err.message =
      err.response?.data?.message ||
      err.response?.data ||
      err.message ||
      "Something went wrong";

    return Promise.reject(err);
  }
);

export default api;