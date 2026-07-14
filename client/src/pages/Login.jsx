import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Droplets, Phone, ArrowRight, Shield } from 'lucide-react';

const GoogleIcon = (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
        <path
            fill="#ea4335"
            d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.555 0-6.437-2.882-6.437-6.437 0-3.555 2.882-6.437 6.437-6.437 1.577 0 3.01.574 4.12 1.518l3.078-3.078C18.995 2.05 15.827 1 12.24 1 5.922 1 1 5.922 1 12.24s4.922 11.24 11.24 11.24c6.236 0 10.748-4.382 10.748-10.748 0-.725-.065-1.423-.187-2.09-.01 0-10.561-.362-10.561-.362z"
        />
    </svg>
);

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    // loginMode: 'email' | 'phone'
    const [loginMode, setLoginMode] = useState('email');
    const [form, setForm] = useState({ identifier: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const user = await login(form.identifier.trim(), form.password);
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'donor') navigate('/donor-dashboard');
            else navigate('/requester-dashboard');
        } catch (err) {
            setError(err.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', overflow: 'hidden' }}>
            {/* Background glow */}
            <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, background: 'radial-gradient(circle, rgba(230,57,70,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(230,57,70,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: 900, position: 'relative', zIndex: 1 }} className="login-grid">
                {/* Left Brand Panel */}
                <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
                    style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: 'var(--border-width) solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
                    className="login-brand">
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: '2.5rem' }}>
                        <div style={{ width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src="/logo_transparent.png" alt="Blood Link Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <span style={{ fontWeight: 850, fontSize: '1.2rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                            Blood<span style={{ color: '#dc2626' }}>Link</span>
                        </span>
                    </Link>

                    <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', lineHeight: 1.2, marginBottom: '0.875rem', letterSpacing: '-0.5px' }}>
                        Welcome Back! 👋
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem', marginBottom: '2rem', fontWeight: 600 }}>
                        Sign in to access your dashboard, manage blood requests, track donations, and connect with donors near you.
                    </p>
                </motion.div>

                {/* Right Form Panel */}
                <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                    <div style={{ background: 'var(--bg-card)', border: 'var(--border-width) solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '2.5rem', boxShadow: 'var(--shadow-md)' }}>
                        <h3 style={{ fontSize: '1.375rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', marginBottom: '0.375rem' }}>Sign in to continue</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.75rem', fontWeight: 650 }}>Enter your credentials to access your account</p>

                        {error && (
                            <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', border: '2px solid var(--primary)', borderRadius: 'var(--radius-sm)', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Login Mode Toggle — email or phone */}
                            <div style={{ display: 'flex', gap: 6, background: 'var(--bg-secondary)', border: 'var(--border-width) solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: 4 }}>
                                {['email', 'phone'].map(mode => (
                                    <button key={mode} type="button" onClick={() => { setLoginMode(mode); setForm(f => ({ ...f, identifier: '' })); }}
                                        style={{ flex: 1, height: 34, borderRadius: 'var(--radius-sm)', border: loginMode === mode ? '2px solid var(--border-color)' : '2px solid transparent', background: loginMode === mode ? 'var(--bg-card)' : 'transparent', color: loginMode === mode ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: loginMode === mode ? 'var(--shadow-sm)' : 'none', transition: 'all 0.15s' }}>
                                        {mode === 'email' ? <Mail style={{ width: 13, height: 13 }} /> : <Phone style={{ width: 13, height: 13 }} />}
                                        {mode === 'email' ? 'Email' : 'Phone'}
                                    </button>
                                ))}
                            </div>

                            {/* Identifier input — email or phone */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                                    {loginMode === 'email' ? 'Email Address' : 'Phone Number'}
                                </label>
                                <div style={{ position: 'relative' }}>
                                    {loginMode === 'email'
                                        ? <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        : <Phone style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                    }
                                    <input
                                        type={loginMode === 'email' ? 'email' : 'tel'}
                                        required
                                        value={form.identifier}
                                        onChange={e => setForm({ ...form, identifier: e.target.value })}
                                        placeholder={loginMode === 'email' ? 'your@email.com' : '10-digit phone number'}
                                        style={{ width: '100%', height: 46, paddingLeft: 44, paddingRight: 16, background: 'var(--bg-card)', border: 'var(--border-width) solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', boxShadow: 'var(--shadow-sm)' }}
                                        onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = 'var(--shadow-md)'; }}
                                        onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'var(--shadow-sm)'; }}
                                    />
                                </div>
                                {loginMode === 'phone' && (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 650 }}>📋 Admin accounts must use email login.</span>
                                )}
                            </div>

                            {/* Password */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Password</label>
                                    <Link to="#" style={{ fontSize: '0.78rem', color: 'var(--primary)', textDecoration: 'underline', fontWeight: 800 }}>Forgot password?</Link>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                    <input type={showPassword ? 'text' : 'password'} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Enter your password"
                                        style={{ width: '100%', height: 46, paddingLeft: 44, paddingRight: 46, background: 'var(--bg-card)', border: 'var(--border-width) solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', boxShadow: 'var(--shadow-sm)' }}
                                        onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.transform = 'translate(-1px, -1px)'; e.target.style.boxShadow = 'var(--shadow-md)'; }}
                                        onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.transform = 'none'; e.target.style.boxShadow = 'var(--shadow-sm)'; }} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                        {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember me */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: 'var(--primary)', width: 15, height: 15, cursor: 'pointer' }} />
                                <label htmlFor="rememberMe" style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', cursor: 'pointer', fontWeight: 700 }}>Remember me for 30 days</label>
                            </div>

                            {/* Submit */}
                            <motion.button type="submit" disabled={loading}
                                style={{ height: 48, background: 'var(--primary)', color: 'var(--text-white)', border: 'var(--border-width) solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontWeight: 900, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-heading)', boxShadow: 'var(--shadow-sm)', marginTop: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.1s ease' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                                onMouseDown={e => { e.currentTarget.style.transform = 'translate(1px, 1px)'; e.currentTarget.style.boxShadow = '1px 1px 0px 0px var(--shadow-color)'; }}
                                onMouseUp={e => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}>
                                {loading ? (
                                    <><span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Signing in...</>
                                ) : (
                                    <>Login <ArrowRight style={{ width: 16, height: 16 }} /></>
                                )}
                            </motion.button>
                        </form>

                        {/* Divider */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', margin: '1.25rem 0' }}>
                            <div style={{ flex: 1, height: 2, background: 'var(--border-color)' }} />
                            <span style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 800 }}>or</span>
                            <div style={{ flex: 1, height: 2, background: 'var(--border-color)' }} />
                        </div>

                        {/* Social */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            <button style={{ height: 44, background: 'var(--bg-secondary)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.1s ease', boxShadow: 'var(--shadow-sm)' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px 0px var(--shadow-color)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                                <GoogleIcon style={{ width: 16, height: 16 }} /> Continue with Google
                            </button>
                        </div>

                        {/* Register Link */}
                        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 650 }}>
                            Don't have an account?{' '}
                            <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 800 }}>Create free account</Link>
                        </p>

                        {/* Security Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <Shield style={{ width: 13, height: 13, color: '#0D9488' }} />
                            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem' }}>Secured with 256-bit SSL encryption</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
