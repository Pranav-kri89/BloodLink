import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-logo">
                    <span className="logo-icon">🩸</span>
                    <span>BloodConnect</span>
                </Link>

                <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? '✕' : '☰'}
                </button>

                <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                    {!user ? (
                        <>
                            <Link to="/search" className={isActive('/search')} onClick={() => setMenuOpen(false)}>
                                Find Donors
                            </Link>
                            <Link to="/login" className={isActive('/login')} onClick={() => setMenuOpen(false)}>
                                Login
                            </Link>
                            <Link to="/register" className={isActive('/register')} onClick={() => setMenuOpen(false)}>
                                Register
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/search" className={isActive('/search')} onClick={() => setMenuOpen(false)}>
                                Find Donors
                            </Link>

                            {user.role === 'donor' && (
                                <Link to="/donor-dashboard" className={isActive('/donor-dashboard')} onClick={() => setMenuOpen(false)}>
                                    My Dashboard
                                </Link>
                            )}

                            {user.role === 'requester' && (
                                <Link to="/requester-dashboard" className={isActive('/requester-dashboard')} onClick={() => setMenuOpen(false)}>
                                    My Dashboard
                                </Link>
                            )}

                            {user.role === 'admin' && (
                                <Link to="/admin" className={isActive('/admin')} onClick={() => setMenuOpen(false)}>
                                    Admin Panel
                                </Link>
                            )}

                            <button
                                className="btn-logout"
                                onClick={() => { logout(); setMenuOpen(false); }}
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
