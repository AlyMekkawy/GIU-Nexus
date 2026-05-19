import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate('/login');
    }

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <div className="navbar-left">
                    <span className="navbar-logo" onClick={() => navigate('/')}>
                        GIU Nexus
                    </span>
                    <div className="navbar-links">
                        <NavLink to="/" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} end>
                            Home
                        </NavLink>
                        <NavLink to="/jobs" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                            Jobs
                        </NavLink>
                        {isAuthenticated && user?.role === 'jobSeeker' && (
                            <NavLink to="/jobs/recommended" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                                Recommended
                            </NavLink>
                        )}
                        {isAuthenticated && user?.role === 'recruiter' && (
                            <NavLink to="/recruiter/dashboard" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                                Dashboard
                            </NavLink>
                        )}
                        {isAuthenticated && user?.role === 'admin' && (
                            <NavLink to="/admin/dashboard" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                                Admin
                            </NavLink>
                        )}
                    </div>
                </div>

                <div className="navbar-right">
                    {isAuthenticated ? (
                        <>
                            {user?.role === 'jobSeeker' && (
                                <NavLink to="/applications/my" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                                    My Applications
                                </NavLink>
                            )}
                            <NavLink to="/profile" className="navbar-avatar" title={user?.name}>
                                {user?.name?.charAt(0).toUpperCase()}
                            </NavLink>
                            <button className="navbar-logout" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="navbar-link-btn" onClick={() => navigate('/login')}>
                                Login
                            </button>
                            <button className="navbar-btn-register" onClick={() => navigate('/register')}>
                                Register
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
