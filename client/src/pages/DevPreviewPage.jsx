import { useEffect } from "react";
import { Navigate } from "react-router-dom";

function DevPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    sessionStorage.setItem("devPreviewUsedChangePassword", "true");
  }, []);

  return <Navigate to="/profile/change-password" replace />;
}

export default DevPreviewPage;
