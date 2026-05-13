import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // Restore session synchronously from localStorage on first render.
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem("user");
            return saved ? JSON.parse(saved) : null;
        } catch {   //protection if parsing fails
            localStorage.removeItem("user");
            return null;
        }
    });
    const [token, setToken] = useState(() => localStorage.getItem("token"));

    function login(newToken, userData) {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
    }

    async function logout() {
        try {
            await api.post("/auth/logout");
        } catch (_) {}
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    }

    const value = {
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}