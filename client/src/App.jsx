import { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { motion, AnimatePresence, useInView, LayoutGroup } from 'framer-motion';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/DonorDashboard';
import SearchDonors from './pages/SearchDonors';
import AdminDashboard from './pages/AdminDashboard';
import RequesterDashboard from './pages/RequesterDashboard';
import DonorJourneyPage from './pages/DonorJourneyPage';
import LiveEmergencyDashboard from './pages/LiveEmergencyDashboard';
import RequestTrackingPage from './pages/RequestTrackingPage';
import Onboarding from './pages/Onboarding';
import { AboutUs, FAQ, PrivacyPolicy, Terms } from './pages/StaticPages';
import Footer from './components/layout/Footer';
import {
    Droplets, Search, Heart, Shield, Zap, Users, MapPin, Star,
    ChevronRight, ArrowRight, Activity, Clock, CheckCircle2,
    Phone, MessageCircle, Award, TrendingUp, Globe,
    Calendar, UserCheck, Stethoscope, FileText, AlertTriangle, Info, Plus
} from 'lucide-react';

import SplashScreen from './components/ui/SplashScreen';
import AnimatedBackground from './components/ui/AnimatedBackground';

// Page Transition Wrapper
const PageWrapper = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.99 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}
        >
            {children}
        </motion.div>
    );
};

// Animated counter hook
function useCounter(target, isVisible, duration = 2000) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!isVisible) return;
        let start = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [isVisible, target, duration]);
    return count;
}

// ECG Line SVG animation
function ECGLine() {
    return (
        <svg viewBox="0 0 400 60" style={{ width: '100%', maxWidth: 400, height: 'auto', opacity: 0.3 }} fill="none">
            <motion.polyline
                points="0,30 40,30 55,5 65,55 75,10 85,50 95,30 400,30"
                stroke="#E63946"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop', repeatDelay: 1.5 }}
            />
        </svg>
    );
}

// Stat Card
function StatCard({ label, target, suffix, icon: Icon, color, delay }) {
    const ref = useRef(null);
    const isVisible = useInView(ref, { once: true });
    const count = useCounter(target, isVisible);
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={isVisible ? { opacity: 1, y: 0 } : {}} transition={{ delay, duration: 0.5 }}
            style={{ textAlign: 'center', padding: '1.5rem 1rem', background: 'var(--bg-card)', border: 'var(--border-width) solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.875rem' }}>
                <Icon style={{ width: 22, height: 22, color }} />
            </div>
            <div style={{ fontWeight: 800, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', letterSpacing: '-1px', lineHeight: 1 }}>
                {count.toLocaleString()}{suffix}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.825rem', fontWeight: 600, marginTop: 5, letterSpacing: '0.2px' }}>{label}</div>
        </motion.div>
    );
}

// Step Item
function HowItWorksStep({ step, title, desc, icon: Icon, delay, color }) {
    const ref = useRef(null);
    const isVisible = useInView(ref, { once: true });
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={isVisible ? { opacity: 1, y: 0 } : {}} transition={{ delay, duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.875rem', zIndex: 1 }}>
            <div style={{ position: 'relative' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--bg-card)', border: 'var(--border-width) solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
                    <Icon style={{ width: 24, height: 24, color }} />
                </div>
                <div style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', color: 'var(--text-white)', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', boxShadow: 'var(--shadow-sm)' }}>
                    {step}
                </div>
            </div>
            <div>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem', fontFamily: 'var(--font-heading)', marginBottom: 4 }}>{title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5, fontWeight: 500 }}>{desc}</div>
            </div>
        </motion.div>
    );
}


// FAQ Item
function FAQItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ background: 'var(--bg-card)', border: 'var(--border-width) solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', transition: 'all 0.25s ease', boxShadow: 'var(--shadow-sm)' }}>
            <button onClick={() => setOpen(!open)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.125rem 1.25rem', background: 'transparent', border: 'none', cursor: 'pointer', gap: '1rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.925rem', textAlign: 'left', fontFamily: 'var(--font-heading)' }}>{q}</span>
                <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0 }}>
                    <ChevronRight style={{ width: 18, height: 18, color: 'var(--text-muted)' }} />
                </motion.div>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                        <div style={{ padding: '0 1.25rem 1.125rem', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, fontWeight: 500 }}>{a}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchCity, setSearchCity] = useState('');
    const [showPredictions, setShowPredictions] = useState(false);
    const [predictions, setPredictions] = useState([]);
    const [stats, setStats] = useState({ donors: 0, livesSaved: 0, citiesCovered: 0, requestsFulfilled: 0 });

    const [cities] = useState([
        'Badiyadka', 'Bajpe', 'Bantwal', 'Belthangady', 'Brahmavar', 'Byndoor', 
        'Cheruvathur', 'Dharmasthala', 'Hosangadi', 'Kadaba', 'Kanhangad', 'Karkala', 
        'Kasaragod', 'Kaup', 'Kinnigoli', 'Kumbla', 'Kundapura', 'Mangaluru', 
        'Manipal', 'Manjeshwar', 'Moodabidri', 'Mulki', 'Mulleria', 'Nileshwar', 
        'Perla', 'Puttur', 'Saligrama', 'Sullia', 'Surathkal', 'Trikaripur', 
        'Udupi', 'Ullal', 'Uppala', 'Vitla'
    ]);
    
    useEffect(() => {
        if (!searchCity.trim()) {
            setPredictions([]);
            return;
        }
        const filtered = cities.filter(c => c.toLowerCase().includes(searchCity.toLowerCase())).slice(0, 10);
        setPredictions(filtered);
    }, [searchCity]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/stats');
                setStats(res.data);
            } catch (err) {
                console.error('Failed to load stats', err);
            }
        };
        fetchStats();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`/search?city=${encodeURIComponent(searchCity)}`);
    };

    const statsRef = useRef(null);
    const statsVisible = useInView(statsRef, { once: true });

    const steps = [
        { step: 1, title: 'Search Blood', desc: 'Select blood group & city. No login needed.', icon: Search, color: 'var(--primary)' },
        { step: 2, title: 'Find Matches', desc: 'AI ranks best donors instantly.', icon: Users, color: 'var(--accent)' },
        { step: 3, title: 'Send Request', desc: 'Log in & send request with one click.', icon: Zap, color: 'var(--secondary)' },
        { step: 4, title: 'Donor Accepts', desc: 'Matched donor gets real-time alert.', icon: Heart, color: 'var(--accent-blue)' },
        { step: 5, title: 'Donate & Save', desc: 'Contact donor, complete donation.', icon: CheckCircle2, color: 'var(--accent-purple)' },
    ];

    const faqs = [
        { q: 'Is Blood Link completely free to use?', a: 'Yes, Blood Link is 100% free for both donors and requesters. We are a non-profit healthcare initiative. No charges ever.' },
        { q: 'How do I know donors are genuine and verified?', a: 'All donors go through ID verification and eligibility checks. Verified donors display a shield badge on their profiles for your trust.' },
        { q: 'Are my personal details shared with donors?', a: 'Donor details are only shared after a request is accepted. Before that, all profiles are anonymous. Your data is encrypted and secure.' },
        { q: 'What blood groups are covered?', a: 'All 8 blood groups: A+, A-, B+, B-, AB+, AB-, O+, O-. We also support rare blood type requests through our emergency network.' },
        { q: 'How quickly can I find a donor?', a: 'In most cases within 30 minutes in major cities. Our emergency broadcast feature alerts all eligible donors in your area instantly.' },
        { q: 'Can I donate blood if I donated recently?', a: 'Whole blood donation requires a 3-month (90 days) gap for males and a 4-month (120 days) gap for females. The system automatically checks your eligibility based on your registered details.' },
    ];

    return (
        <div style={{ background: 'var(--bg-body)', minHeight: '100vh', color: 'var(--text-primary)' }}>
            
            {/* ==================== HERO SECTION ==================== */}
            <section style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(4rem, 8vw, 6rem) 1.5rem clamp(3rem, 6vw, 5rem)', background: 'var(--bg-card)' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(37, 99, 235, 0.05) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
                
                <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
                    
                    {/* Peer-to-Peer Subtitle */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--primary-light)', color: 'var(--primary)', padding: '6px 16px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                        <Droplets style={{ width: 14, height: 14 }} />
                        <span>DIRECT PEER-TO-PEER BLOOD MATCH NETWORK</span>
                    </div>

                    {/* Main Title */}
                    <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', lineHeight: 1.15, marginBottom: '1.25rem', letterSpacing: '-1px' }}>
                        Direct, Accessible & Real-Time <br />
                        <span style={{ color: 'var(--primary)' }}>Blood Match Network</span>
                    </h1>

                    <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(1rem, 2vw, 1.15rem)', lineHeight: 1.6, maxWidth: 680, margin: '0 auto 2.5rem', fontWeight: 500 }}>
                        Register as a donor or request a critical blood match. We connect donors and recipients directly with zero middleman overhead. Transparent, secure, and always free.
                    </p>

                    {/* Prominent Central Predictive Smart Search Bar */}
                    <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto 2.5rem' }}>
                        <form onSubmit={handleSearch} className="hero-search-form">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, paddingLeft: 16 }} className="hero-search-input">
                                <Search style={{ width: 20, height: 20, color: 'var(--text-muted)' }} />
                                <input 
                                    type="text" 
                                    value={searchCity} 
                                    onChange={e => { setSearchCity(e.target.value); setShowPredictions(true); }}
                                    onFocus={() => setShowPredictions(true)}
                                    placeholder="Enter your city (e.g. Mangaluru, Bangalore)..." 
                                    style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', color: 'var(--text-primary)', fontSize: '0.975rem', fontWeight: 500 }} 
                                />
                            </div>
                            <button type="submit" style={{ background: 'var(--primary)', color: 'var(--text-white)', border: 'none', borderRadius: '100px', padding: '10px 24px', fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.2s' }}>
                                Find Donor
                            </button>
                        </form>

                        {/* Predictive Search Dropdown */}
                        <AnimatePresence>
                            {showPredictions && predictions.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 8 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    exit={{ opacity: 0, y: 8 }}
                                    style={{ position: 'absolute', top: '105%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 10, padding: '8px 0', textAlign: 'left' }}
                                >
                                    {predictions.map(city => (
                                        <div 
                                            key={city} 
                                            onClick={() => { setSearchCity(city); setShowPredictions(false); }}
                                            style={{ padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <MapPin style={{ width: 14, height: 14, color: 'var(--primary)' }} />
                                            {city}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {showPredictions && predictions.length > 0 && (
                            <div onClick={() => setShowPredictions(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
                        )}
                    </div>

                    {/* Bold High-Contrast Action Buttons */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
                        {user ? (
                            <>
                                <Link to={user.role === 'admin' ? '/admin' : user.role === 'donor' ? '/donor-dashboard' : '/requester-dashboard'} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '14px 28px', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'var(--text-white)', fontWeight: 800, fontSize: '0.95rem', boxShadow: 'var(--shadow-md)', transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-dark)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}>
                                    <UserCheck style={{ width: 18, height: 18 }} />
                                    Go to Dashboard
                                </Link>
                                
                                <Link to="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '14px 28px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 800, fontSize: '0.95rem', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}>
                                    <Search style={{ width: 18, height: 18, color: 'var(--primary)' }} />
                                    Request a Blood Match
                                </Link>

                                <Link to="/live" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '14px 28px', borderRadius: 'var(--radius-md)', background: 'var(--secondary)', color: 'var(--text-white)', fontWeight: 800, fontSize: '0.95rem', boxShadow: 'var(--shadow-md)', transition: 'opacity 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
                                    onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                                    <Zap style={{ width: 18, height: 18 }} />
                                    View Live Requests
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '14px 28px', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'var(--text-white)', fontWeight: 800, fontSize: '0.95rem', boxShadow: 'var(--shadow-md)', transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-dark)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}>
                                    <Heart style={{ width: 18, height: 18 }} />
                                    Register as Donor
                                </Link>
                                
                                <Link to="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '14px 28px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 800, fontSize: '0.95rem', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}>
                                    <Search style={{ width: 18, height: 18, color: 'var(--primary)' }} />
                                    Request a Blood Match
                                </Link>

                                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '14px 28px', borderRadius: 'var(--radius-md)', background: 'var(--secondary)', color: 'var(--text-white)', fontWeight: 800, fontSize: '0.95rem', boxShadow: 'var(--shadow-md)', transition: 'opacity 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
                                    onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                                    <UserCheck style={{ width: 18, height: 18 }} />
                                    User Portal Login
                                </Link>
                            </>
                        )}
                    </div>

                </div>
            </section>

            {/* ==================== STATISTICS ==================== */}
            <section ref={statsRef} style={{ padding: '2rem 1.5rem', background: 'var(--bg-secondary)' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <StatCard label="Verified Donors" target={stats.donors} suffix="" icon={Users} color="var(--primary)" delay={0} />
                    <StatCard label="Lives Saved" target={stats.livesSaved} suffix="" icon={Heart} color="var(--secondary)" delay={0.1} />
                    <StatCard label="Cities Covered" target={stats.citiesCovered} suffix="" icon={MapPin} color="var(--accent-blue)" delay={0.2} />
                    <StatCard label="Requests Fulfilled" target={stats.requestsFulfilled} suffix="" icon={CheckCircle2} color="var(--accent)" delay={0.3} />
                </div>
            </section>

            {/* ==================== BENTO GRID ==================== */}
            <section style={{ padding: '5rem 1.5rem' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', letterSpacing: '-1px' }}>Connected Match Dashboard</h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1rem', fontWeight: 500 }}>Access real-time recipient requests, donor points programs, and pre-donation advisories.</p>
                    </div>

                    <div className="bento-grid">
                        
                        {/* Bento Item 1: Our Services */}
                        <div style={{ background: 'var(--bg-card)', border: 'var(--border-width) solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2.25rem', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} className="bento-card-8">
                            <div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 800, marginBottom: '1rem' }}>
                                    <span>MATCH PROVISIONS</span>
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Our Services</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '2rem', fontWeight: 500 }}>
                                    Connecting recipients with volunteer donors directly. Our peer-to-peer matching algorithm eliminates clinical overhead, bridging critical needs in minutes.
                                </p>
                                
                                <div className="bento-inner-grid" style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Droplets style={{ width: 18, height: 18, color: 'var(--primary)' }} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 800, fontSize: '0.925rem', color: 'var(--text-primary)', marginBottom: 2 }}>Real-time Donor Match</h4>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, fontWeight: 500 }}>Ranked matching based on blood type, location, and donor availability.</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Zap style={{ width: 18, height: 18, color: 'var(--primary)' }} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 800, fontSize: '0.925rem', color: 'var(--text-primary)', marginBottom: 2 }}>SOS Broadcast Alerts</h4>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, fontWeight: 500 }}>Instant phone and SMS broadcasts to local verified panels.</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <UserCheck style={{ width: 18, height: 18, color: 'var(--primary)' }} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 800, fontSize: '0.925rem', color: 'var(--text-primary)', marginBottom: 2 }}>Recipient Status Tracking</h4>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, fontWeight: 500 }}>Live monitoring of donor transit and acceptance reports.</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Shield style={{ width: 18, height: 18, color: 'var(--primary)' }} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 800, fontSize: '0.925rem', color: 'var(--text-primary)', marginBottom: 2 }}>Secure Verification</h4>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, fontWeight: 500 }}>All user credentials verified against safety guidelines and donation history.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active emergency channels are monitored 24/7.</span>
                                <Link to="/live" style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'var(--primary)', fontWeight: 800, fontSize: '0.875rem' }}>
                                    Live Feeds <ArrowRight style={{ width: 14, height: 14 }} />
                                </Link>
                            </div>
                        </div>

                        {/* Bento Item 2: Donor Incentives */}
                        <div style={{ background: 'var(--bg-card)', border: 'var(--border-width) solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2.25rem', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} className="bento-card-4">
                            <div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', padding: '4px 12px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 800, marginBottom: '1rem' }}>
                                    <span>COMMUNITY CREDIT PROGRAM</span>
                                </div>
                                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Donor Incentives</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.5rem', fontWeight: 500 }}>
                                    Registered donors earn community appreciation points, verified badge standings, and clinical credit vouchers for future needs:
                                </p>
                                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', listStyle: 'none', padding: 0 }}>
                                    <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                        <CheckCircle2 style={{ width: 15, height: 15, color: 'var(--secondary)', flexShrink: 0 }} /> Appreciation Certificates & Profile Badge upgrades
                                    </li>
                                    <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                        <CheckCircle2 style={{ width: 15, height: 15, color: 'var(--secondary)', flexShrink: 0 }} /> Priority recipient request access for family members
                                    </li>
                                    <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                        <CheckCircle2 style={{ width: 15, height: 15, color: 'var(--secondary)', flexShrink: 0 }} /> Free physical index checkups (BP, Hemoglobin)
                                    </li>
                                </ul>
                            </div>
                            <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Shield style={{ width: 16, height: 16, color: 'var(--secondary)' }} />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Incentives collaborative across municipal blood directories.</span>
                            </div>
                        </div>

                        {/* Bento Item 3: Latest Health Advisories */}
                        <div style={{ background: 'var(--bg-card)', border: 'var(--border-width) solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2rem 2.25rem', boxShadow: 'var(--shadow-md)' }} className="bento-card-12">
                            <div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent)', padding: '4px 12px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                                    <Info style={{ width: 12, height: 12 }} />
                                    <span>SAFE DONATION GUIDELINES</span>
                                </div>
                                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Health Advisories</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, fontWeight: 500 }}>
                                    Safety requirements to guarantee a seamless, direct connection experience for both parties.
                                </p>
                            </div>
                            <div className="bento-sub-grid">
                                <div style={{ background: 'var(--bg-secondary)', padding: '1.125rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 800, background: 'var(--primary-light)', color: 'var(--primary)', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                                        <h4 style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Hydration Rules</h4>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, fontWeight: 500 }}>Consume at least 500ml of clean drinking water 1-2 hours prior to arrival.</p>
                                </div>
                                <div style={{ background: 'var(--bg-secondary)', padding: '1.125rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 800, background: 'var(--primary-light)', color: 'var(--primary)', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                                        <h4 style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Dietary Advice</h4>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, fontWeight: 500 }}>Eat a wholesome, low-fat meal 3 hours before. Avoid heavy, oily fasting state.</p>
                                </div>
                                <div style={{ background: 'var(--bg-secondary)', padding: '1.125rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 800, background: 'var(--primary-light)', color: 'var(--primary)', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                                        <h4 style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Donation Gaps</h4>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, fontWeight: 500 }}>Ensure a gap of minimum 60 days since your last whole blood donation session.</p>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </section>

            {/* ==================== EMERGENCY CTA ==================== */}
            <section style={{ padding: '3rem 1.5rem 5rem' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        style={{ position: 'relative', background: 'var(--primary)', color: 'var(--text-white)', borderRadius: 'var(--radius-lg)', padding: '3.5rem clamp(1.5rem, 4vw, 3.5rem)', textAlign: 'center', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 100, padding: '5px 14px', marginBottom: '1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFFFFF', animation: 'pulse-dot 1.2s infinite' }} /> Urgent Hospital Broadcast
                            </span>
                            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-heading)', marginBottom: '0.875rem', letterSpacing: '-0.5px' }}>
                                In Urgent Need of a Blood Request?
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', lineHeight: 1.6, maxWidth: 480, margin: '0 auto 2rem', fontWeight: 500 }}>
                                Immediately broadcast your request to matches in your area. Donors receive automated SMS and mobile calls.
                            </p>
                            <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <Link to="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '13px 28px', borderRadius: 'var(--radius-md)', background: '#FFFFFF', color: 'var(--primary)', fontWeight: 800, fontSize: '0.975rem', fontFamily: 'var(--font-heading)', boxShadow: 'var(--shadow-sm)' }}>
                                    <Zap style={{ width: 17, height: 17 }} /> Start SOS Match
                                </Link>
                                <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '13px 28px', borderRadius: 'var(--radius-md)', background: 'transparent', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 800, fontSize: '0.975rem' }}>
                                    Become a Registered Donor <ArrowRight style={{ width: 16, height: 16 }} />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ==================== HOW IT WORKS ==================== */}
            <section style={{ padding: '5rem 1.5rem', background: 'var(--bg-card)' }}>
                <div style={{ maxWidth: 960, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-secondary)', borderRadius: 100, padding: '5px 14px', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Simple Process</span>
                        </div>
                        <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', letterSpacing: '-1px' }}>How Blood Link Works</h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.625rem', fontSize: '1rem', maxWidth: 480, margin: '0.625rem auto 0', fontWeight: 500 }}>5 simple steps to save a life in under 30 minutes.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.5rem', position: 'relative' }} className="steps-grid">
                        <div style={{ position: 'absolute', top: 28, left: '10%', right: '10%', height: 2, background: 'var(--border-color)', zIndex: 0 }} />
                        {steps.map((s, i) => (
                            <HowItWorksStep key={i} {...s} delay={i * 0.12} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ==================== FAQs ==================== */}
            <section style={{ padding: '5rem 1.5rem', background: 'var(--bg-card)', borderTop: 'var(--border-width) solid var(--border-color)' }}>
                <div style={{ maxWidth: 720, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.5px' }}>Frequently Asked Questions</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {faqs.map((faq, i) => <FAQItem key={i} {...faq} />)}
                    </div>
                </div>
            </section>
        </div>
    );
}

function App() {
    const { loading, user } = useAuth();
    const location = useLocation();
    const [showSplash, setShowSplash] = useState(true);

    const handleSplashComplete = useCallback(() => {
        setShowSplash(false);
    }, []);

    let mainContent;
    if (user?.onboardingRequired) {
        mainContent = (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', flex: 1, background: 'transparent' }}>
                <Navbar />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route path="/onboarding" element={<PageWrapper><Onboarding /></PageWrapper>} />
                            <Route path="*" element={<Navigate to="/onboarding" replace />} />
                        </Routes>
                    </AnimatePresence>
                </div>
            </div>
        );
    } else {
        mainContent = (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', flex: 1, background: 'transparent' }}>
                <Navbar />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
                            <Route path="/login" element={<Navigate to="/" replace />} />
                            <Route path="/register" element={<Navigate to="/" replace />} />
                            <Route path="/onboarding" element={<Navigate to="/" replace />} />
                            <Route path="/search" element={<PageWrapper><SearchDonors /></PageWrapper>} />
                            <Route path="/live" element={<PageWrapper><LiveEmergencyDashboard /></PageWrapper>} />
                            <Route path="/track/:id" element={<PageWrapper><RequestTrackingPage /></PageWrapper>} />
                            <Route path="/about" element={<PageWrapper><AboutUs /></PageWrapper>} />
                            <Route path="/faq" element={<PageWrapper><FAQ /></PageWrapper>} />
                            <Route path="/privacy" element={<PageWrapper><PrivacyPolicy /></PageWrapper>} />
                            <Route path="/terms" element={<PageWrapper><Terms /></PageWrapper>} />
                            <Route path="/donor-dashboard" element={
                                <ProtectedRoute roles={['donor']}>
                                    <PageWrapper><DonorDashboard /></PageWrapper>
                                </ProtectedRoute>
                            } />
                            <Route path="/donor-journey/:id" element={
                                <ProtectedRoute roles={['donor']}>
                                    <PageWrapper><DonorJourneyPage /></PageWrapper>
                                </ProtectedRoute>
                            } />
                            <Route path="/requester-dashboard" element={
                                <ProtectedRoute roles={['requester']}>
                                    <PageWrapper><RequesterDashboard /></PageWrapper>
                                </ProtectedRoute>
                            } />
                            <Route path="/admin" element={
                                <ProtectedRoute roles={['admin']}>
                                    <PageWrapper><AdminDashboard /></PageWrapper>
                                </ProtectedRoute>
                            } />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </AnimatePresence>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <LayoutGroup>
            <AnimatePresence>
                {showSplash && <SplashScreen key="splash" onComplete={handleSplashComplete} />}
            </AnimatePresence>
            {!showSplash && !loading && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', flex: 1 }}
                >
                    {mainContent}
                </motion.div>
            )}
            {!showSplash && loading && (
                <div style={{ minHeight: '100vh', background: 'var(--bg-body)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner" style={{ marginBottom: '1.25rem', width: '48px', height: '48px', borderWidth: '3px' }}></div>
                    <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                        Waking up the server...
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '350px', textAlign: 'center', lineHeight: 1.5, fontWeight: 500 }}>
                        If this is your first visit in a while, it may take a few moments to establish a secure connection.
                    </p>
                </div>
            )}
        </LayoutGroup>
    );
}

export default App;
