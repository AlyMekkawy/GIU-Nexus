// client/src/App.jsx
import { Routes, Route } from "react-router-dom";

import PrivateRoute from "./components/PrivateRoute";
import RoleRoute from "./components/RoleRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import DevPreviewPage from "./pages/DevPreviewPage";

import JobListPage from "./pages/JobListPage";
import JobDetailPage from "./pages/JobDetailPage";
import RecommendedJobsPage from "./pages/RecommendedJobsPage";
import SavedJobsPage from "./pages/SavedJobsPage";
import MyApplicationsPage from "./pages/MyApplicationsPage";

import RecruiterDashboard from "./pages/RecruiterDashboard";
import CreateJobPage from "./pages/CreateJobPage";
import EditJobPage from "./pages/EditJobPage";
import ApplicantsPage from "./pages/ApplicantsPage";

import AdminDashboard from "./pages/AdminDashboard.jsx";
import PendingRecruitersPage from "./pages/PendingRecruitersPage";
import AdminJobsPage from "./pages/AdminJobsPage";
import AdminUsersPage from "./pages/AdminUsersPage";

function App() {
  return (
      <Routes>
          {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        <Route path="/jobs" element={<JobListPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />

          {/* Private / Role specific */}
        <Route path="/profile" element={
            <RoleRoute allowedRoles={["jobSeeker"]}>
            <ProfilePage/>
            </RoleRoute>
        } />

        <Route path="/profile/edit" element={
            <PrivateRoute>
            <EditProfilePage/>
            </PrivateRoute>}
        />

        <Route
            path="/profile/change-password"
            element={
              <PrivateRoute>
                <ChangePasswordPage />
              </PrivateRoute>
            }
        />

        <Route
            path="/jobs/recommended"
            element={
              <RoleRoute allowedRoles={["jobSeeker"]}>
                <RecommendedJobsPage />
              </RoleRoute>
            }
        />

        <Route
            path="/jobs/saved"
            element={
              <RoleRoute allowedRoles={["jobSeeker"]}>
                <SavedJobsPage />
              </RoleRoute>
            }
        />

        <Route
            path="/applications/my"
            element={
              <RoleRoute allowedRoles={["jobSeeker"]}>
                <MyApplicationsPage />
              </RoleRoute>
            }
        />

        <Route
            path="/recruiter/dashboard"
            element={
              <RoleRoute allowedRoles={["recruiter"]}>
                <RecruiterDashboard />
              </RoleRoute>
            }
        />

        <Route
            path="/recruiter/jobs/create"
            element={
              <RoleRoute allowedRoles={["recruiter"]}>
                <CreateJobPage />
              </RoleRoute>
            }
        />

        <Route
            path="/recruiter/jobs/:id/edit"
            element={
              <RoleRoute allowedRoles={["recruiter"]}>
                <EditJobPage />
              </RoleRoute>
            }
        />

        <Route
            path="/recruiter/applicants/:jobId"
            element={
              <RoleRoute allowedRoles={["recruiter"]}>
                <ApplicantsPage />
              </RoleRoute>
            }
        />

        <Route
            path="/admin/dashboard"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </RoleRoute>
            }
        />

        <Route
            path="/admin/recruiters"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <PendingRecruitersPage />
              </RoleRoute>
            }
        />

        <Route
            path="/admin/jobs"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <AdminJobsPage />
              </RoleRoute>
            }
        />

        <Route
            path="/admin/users"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <AdminUsersPage />
              </RoleRoute>
            }
        />
      </Routes>
  );
}

export default App;