import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(245,245,247,0.78)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0,0,0,0.08)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        height: '64px', padding: '0 24px', maxWidth: '1440px', margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link to="/" style={{ fontSize: '20px', fontWeight: '700', color: '#004e9f', textDecoration: 'none' }}>
            GIU Nexus
          </Link>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link to="/" style={{ color: '#004e9f', fontWeight: '700', textDecoration: 'none', borderBottom: '2px solid #004e9f', paddingBottom: '4px' }}>Home</Link>
            <Link to="/jobs" style={{ color: '#414753', fontWeight: '500', textDecoration: 'none' }}>Jobs</Link>
            {isAuthenticated && user?.role === 'jobSeeker' && (
              <Link to="/jobs/recommended" style={{ color: '#414753', fontWeight: '500', textDecoration: 'none' }}>Recommended</Link>
            )}
            {isAuthenticated && user?.role === 'recruiter' && (
              <Link to="/recruiter/dashboard" style={{ color: '#414753', fontWeight: '500', textDecoration: 'none' }}>Dashboard</Link>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <Link to="/admin/dashboard" style={{ color: '#414753', fontWeight: '500', textDecoration: 'none' }}>Admin</Link>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isAuthenticated ? (
            <>
              <Link to="/profile" style={{ color: '#414753', fontWeight: '500', textDecoration: 'none', fontSize: '14px' }}>
                {user?.name}
              </Link>
              <button
                onClick={logout}
                style={{ background: 'none', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '9999px', padding: '6px 16px', cursor: 'pointer', fontSize: '14px', color: '#414753', fontWeight: '500' }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: '#414753', fontWeight: '500', textDecoration: 'none', fontSize: '14px' }}>Login</Link>
              <Link to="/register" style={{ background: '#004e9f', color: '#fff', padding: '8px 20px', borderRadius: '9999px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;