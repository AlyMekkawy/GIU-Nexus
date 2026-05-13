import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api/v1",
});

// Attach JWT Bearer token from localStorage to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Normalize error messages
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

        err.message =
            err.response?.data?.message ||
            err.message ||
            "Something went wrong";

        return Promise.reject(err);
    }
);

export default api;