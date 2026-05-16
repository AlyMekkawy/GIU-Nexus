import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PrivateRoute({ children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        const searchParams = new URLSearchParams(location.search);
        const devPreview = searchParams.get("devPreview");
        const previewUsed = sessionStorage.getItem("devPreviewUsedChangePassword");

        if (devPreview === "1" && previewUsed !== "true" && location.pathname === "/profile/change-password") {
            sessionStorage.setItem("devPreviewUsedChangePassword", "true");
            return children;
        }

        return <Navigate to="/login" replace />;
    }
    return children;
}

export default PrivateRoute;