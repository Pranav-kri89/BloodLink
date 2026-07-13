import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
    Droplets, Bell, User, LogOut, Menu, X, ChevronDown,
    Heart, Search, Activity, Shield, Home, BookOpen, Phone, Info, Check,
    Moon, Sun, Trash2, Loader2
} from 'lucide-react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';

export default function Navbar() {
    const { user, token, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    
    // Notification state
    const [notifSidebarOpen, setNotifSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isLoadingNotifs, setIsLoadingNotifs] = useState(true);

    useEffect(() => {
        if (!token) return;
        const fetchNotifications = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get('/api/notifications', config);
                setNotifications(res.data);
            } catch (err) {
                console.error('Failed to load notifications');
            } finally {
                setIsLoadingNotifs(false);
            }
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [token]);

    const markAllAsRead = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put('/api/notifications/read-all', {}, config);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Failed to mark all as read');
        }
    };

    const markAsRead = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`/api/notifications/${id}/read`, {}, config);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (err) {
            console.error('Failed to mark as read');
        }
    };

    const deleteNotification = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`/api/notifications/${id}`, config);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            console.error('Failed to delete notification');
        }
    };

    const clearAllNotifications = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete('/api/notifications/clear-all', config);
            setNotifications([]);
        } catch (err) {
            console.error('Failed to clear all notifications');
        }
    };
    
    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
        setUserMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/');
        setUserMenuOpen(false);
    };

    const getDashboardLink = () => {
        if (!user) return '/login';
        if (user.role === 'admin') return '/admin';
        if (user.role === 'donor') return '/donor-dashboard';
        return '/requester-dashboard';
    };

    const navLinks = [
        { to: '/', label: 'Home', icon: Home },
        { to: '/search', label: 'Find Donors', icon: Search },
        { to: '/live', label: 'Live', icon: Activity, badge: true },
        { to: '/about', label: 'About', icon: Info },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <nav style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'var(--bg-card)',
                borderBottom: 'var(--border-width) solid var(--border-color)',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                    {/* Logo */}
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <motion.img layoutId="brand-logo" src="/logo_transparent.png" alt="Blood Link Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <div>
                            <span style={{ fontWeight: 850, fontSize: '1.25rem', fontFamily: 'var(--font-heading)', letterSpacing: '-0.5px' }}>
                                <span style={{ color: 'var(--text-primary)' }}>Blood</span><span style={{ color: '#dc2626' }}>Link</span>
                            </span>
                            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.5px', lineHeight: 1.2, marginTop: 1, textTransform: 'uppercase' }}>
                                <span style={{ color: 'var(--text-primary)' }}>CONNECTING DONORS, </span><span style={{ color: '#dc2626' }}>SAVING LIVES.</span>
                            </div>
                        </div>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hidden md:flex">
                        {navLinks.map(({ to, label, icon: Icon, badge }) => (
                            <Link key={to} to={to} style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 800, transition: 'all 0.1s ease', position: 'relative',
                                color: isActive(to) ? 'var(--text-white)' : 'var(--text-secondary)',
                                background: isActive(to) ? 'var(--primary)' : 'transparent',
                                border: isActive(to) ? '2px solid var(--border-color)' : '2px solid transparent',
                                boxShadow: isActive(to) ? '2px 2px 0px 0px var(--shadow-color)' : 'none'
                            }}
                            onMouseEnter={e => {
                                if (!isActive(to)) {
                                    e.currentTarget.style.background = 'var(--bg-secondary)';
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    e.currentTarget.style.transform = 'translate(-1px, -1px)';
                                    e.currentTarget.style.boxShadow = '2px 2px 0px 0px var(--shadow-color)';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!isActive(to)) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = 'none';
                                }
                            }}>
                                <Icon style={{ width: 14, height: 14 }} />
                                {label}
                                {badge && (
                                    <span style={{ position: 'absolute', top: 5, right: 8, width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', border: '1px solid var(--border-color)', animation: 'pulse-dot 1.5s infinite' }} />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Right Section */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {/* Theme Toggle */}
                        <button onClick={() => setTheme(theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'light' : 'dark')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '2px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.1s ease', boxShadow: '2px 2px 0px 0px var(--shadow-color)' }}>
                            {theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
                        </button>
                        {user ? (
                            <>
                                {/* Notifications */}
                                <button onClick={() => setNotifSidebarOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '2px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', position: 'relative', boxShadow: '2px 2px 0px 0px var(--shadow-color)' }}>
                                    <Bell style={{ width: 16, height: 16 }} />
                                    {unreadCount > 0 && (
                                        <span style={{ position: 'absolute', top: -4, right: -4, background: '#dc3545', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-card)' }}>
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* User Menu */}
                                <div style={{ position: 'relative' }}>
                                    <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-color)', background: 'var(--bg-secondary)', cursor: 'pointer', transition: 'all 0.1s ease', color: 'var(--text-primary)', boxShadow: '2px 2px 0px 0px var(--shadow-color)' }}>
                                        <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-color)', background: (!user.profilePicture && user.role !== 'admin') ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-white)', overflow: 'hidden' }}>
                                            {user.profilePicture ? (
                                                <img src={user.profilePicture} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : user.role === 'admin' ? (
                                                <img src="/logo_transparent.png" alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                user.name?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{user.name?.split(' ')[0]}</span>
                                            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'capitalize', fontWeight: 700, lineHeight: 1 }}>{user.role}</span>
                                        </div>
                                        <ChevronDown style={{ width: 13, height: 13, color: 'var(--text-muted)', transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                    </button>

                                    <AnimatePresence>
                                        {userMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                                transition={{ duration: 0.15 }}
                                                style={{ position: 'absolute', top: '115%', right: 0, width: 200, background: 'var(--bg-card)', border: 'var(--border-width) solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', zIndex: 200 }}
                                            >
                                                <div style={{ padding: '0.875rem 1rem', borderBottom: 'var(--border-width) solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{user.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{user.email}</div>
                                                </div>

                                                {[
                                                    { to: getDashboardLink(), icon: User, label: 'My Dashboard' },
                                                    { to: '/search', icon: Search, label: 'Search Donors' },
                                                    { to: '/live', icon: Activity, label: 'Live Emergencies' },
                                                ].map(item => (
                                                    <Link key={item.to} to={item.to}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 650, transition: 'all 0.1s ease' }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                                                        <item.icon style={{ width: 15, height: 15, color: 'var(--primary)' }} />
                                                        {item.label}
                                                    </Link>
                                                ))}

                                                <div style={{ borderTop: 'var(--border-width) solid var(--border-color)', padding: '0.5rem' }}>
                                                    <button onClick={handleLogout}
                                                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.625rem 0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 800, borderRadius: 'var(--radius-sm)', transition: 'all 0.1s ease' }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                        <LogOut style={{ width: 15, height: 15 }} />
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        ) : (
                            <>
                                <SignInButton mode="modal">
                                    <div style={{ textDecoration: 'none', padding: '7px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)', border: '2px solid var(--border-color)', background: 'var(--bg-secondary)', transition: 'all 0.1s ease', boxShadow: '2px 2px 0px 0px var(--shadow-color)', cursor: 'pointer', display: 'inline-block' }}>
                                        Login
                                    </div>
                                </SignInButton>
                                <SignUpButton mode="modal">
                                    <div style={{ textDecoration: 'none', padding: '7px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-white)', background: 'var(--primary)', border: '2px solid var(--border-color)', boxShadow: '2px 2px 0px 0px var(--shadow-color)', transition: 'all 0.1s ease', cursor: 'pointer', display: 'inline-block' }}>
                                        Join Free
                                    </div>
                                </SignUpButton>
                            </>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button onClick={() => setMobileOpen(!mobileOpen)}
                            style={{ display: 'none', background: 'var(--bg-secondary)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: 6, cursor: 'pointer', color: 'var(--text-primary)', boxShadow: '2px 2px 0px 0px var(--shadow-color)' }}
                            className="md:hidden block">
                            {mobileOpen ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ background: 'var(--bg-card)', borderBottom: 'var(--border-width) solid var(--border-color)', overflow: 'hidden', zIndex: 99, position: 'sticky', top: 64, boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {navLinks.map(({ to, label, icon: Icon }) => (
                                <Link key={to} to={to} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: isActive(to) ? 'var(--text-white)' : 'var(--text-secondary)', background: isActive(to) ? 'var(--primary)' : 'transparent', border: isActive(to) ? '2px solid var(--border-color)' : '2px solid transparent', fontWeight: 800, fontSize: '0.875rem' }}>
                                    <Icon style={{ width: 16, height: 16 }} /> {label}
                                </Link>
                            ))}
                            {!user && (
                                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.75rem', borderTop: 'var(--border-width) solid var(--border-color)' }}>
                                    <SignInButton mode="modal">
                                        <div style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '10px', borderRadius: 'var(--radius-sm)', fontWeight: 800, color: 'var(--text-primary)', border: '2px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: '0.875rem', cursor: 'pointer' }}>Login</div>
                                    </SignInButton>
                                    <SignUpButton mode="modal">
                                        <div style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '10px', borderRadius: 'var(--radius-sm)', fontWeight: 800, color: 'var(--text-white)', background: 'var(--primary)', border: '2px solid var(--border-color)', fontSize: '0.875rem', cursor: 'pointer' }}>Register</div>
                                    </SignUpButton>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Click outside to close user menu */}
            {userMenuOpen && (
                <div onClick={() => setUserMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
            )}

            {/* Notification Sidebar */}
            <AnimatePresence>
                {notifSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
                            onClick={() => setNotifSidebarOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{
                                position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 400,
                                background: 'var(--bg-card)', zIndex: 1001, boxShadow: 'var(--shadow-lg)',
                                display: 'flex', flexDirection: 'column', borderLeft: 'var(--border-width) solid var(--border-color)'
                            }}
                        >
                            <div style={{ padding: '1.5rem', borderBottom: 'var(--border-width) solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Notifications</h2>
                                    {unreadCount > 0 && (
                                        <span style={{ background: '#dc3545', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                                <button onClick={() => setNotifSidebarOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    <X style={{ width: 24, height: 24 }} />
                                </button>
                            </div>
                            
                            {(unreadCount > 0 || notifications.length > 0) && (
                                <div style={{ padding: '0.75rem 1rem', borderBottom: 'var(--border-width) solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllAsRead} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--bg-secondary)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                            <Check style={{ width: 14, height: 14 }} /> Mark all read
                                        </button>
                                    )}
                                    {notifications.length > 0 && (
                                        <button onClick={clearAllNotifications} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'transparent', border: '2px solid transparent', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}
                                            onMouseEnter={e => { e.currentTarget.style.color = '#dc3545'; e.currentTarget.style.background = 'rgba(220, 53, 69, 0.1)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                                            <Trash2 style={{ width: 14, height: 14 }} /> Clear All
                                        </button>
                                    )}
                                </div>
                            )}

                            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {isLoadingNotifs ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <Loader2 style={{ width: 32, height: 32, animation: 'spin 1s linear infinite' }} />
                                        <p style={{ fontWeight: 700, margin: 0 }}>Loading notifications...</p>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem' }}>
                                        <Bell style={{ width: 48, height: 48, margin: '0 auto 1rem', opacity: 0.2 }} />
                                        <p style={{ fontWeight: 700 }}>No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.map(notif => {
                                        const isRead = notif.read;
                                        return (
                                            <div 
                                                key={notif._id} 
                                                className={isRead ? "" : "glass-panel animate-emergency-pulse"} 
                                                onClick={() => { if (!isRead) markAsRead(notif._id); }}
                                                style={{
                                                    padding: '1rem', borderRadius: 'var(--radius-sm)',
                                                    background: isRead ? 'var(--bg-secondary)' : 'var(--glass-bg, rgba(37, 99, 235, 0.05))',
                                                    border: isRead ? '2px solid var(--border-color)' : '2px solid rgba(230, 57, 70, 0.3)',
                                                    display: 'flex', flexDirection: 'column', gap: '0.5rem',
                                                    cursor: isRead ? 'default' : 'pointer',
                                                    position: 'relative'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {!isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc3545', display: 'inline-block' }} />}
                                                        {notif.type === 'blood_request' ? '🩸 Emergency Blood Request' : 
                                                         notif.type === 'request_accepted' ? '🤝 Request Accepted' : 
                                                         notif.type === 'request_rejected' ? '❌ Request Rejected' : 
                                                         notif.type === 'request_fulfilled' ? '⭐ Request Fulfilled' : 
                                                         notif.type === 'donation_completed' ? '🎉 Donation Completed' : 
                                                         notif.type === 'emergency_nearby' ? '🚨 Emergency Nearby' : 'Notification'}
                                                    </div>
                                                    <button 
                                                        onClick={(e) => deleteNotification(notif._id, e)}
                                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)' }}
                                                        onMouseEnter={e => { e.currentTarget.style.color = '#dc3545'; e.currentTarget.style.background = 'rgba(220, 53, 69, 0.1)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                                                    >
                                                        <Trash2 style={{ width: 14, height: 14 }} />
                                                    </button>
                                                </div>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, fontWeight: 600 }}>
                                                    {notif.message}
                                                </p>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                                    {new Date(notif.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
