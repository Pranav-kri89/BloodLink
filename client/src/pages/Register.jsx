import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Droplets, User, Mail, Lock, Phone, Eye, EyeOff,
    ArrowRight, ArrowLeft, CheckCircle2, Heart, Activity,
    MapPin, Calendar, Shield, ChevronRight, Loader2, Camera
} from 'lucide-react';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const cities = [
    'Bantwal', 'Kanhangad', 'Kasaragod', 'Kumbla', 'Mangaluru', 
    'Manipal', 'Manjeshwar', 'Nileshwar', 'Puttur', 'Udupi'
];

const inputStyle = {
    width: '100%', height: 46, paddingLeft: 44, paddingRight: 16,
    background: 'var(--bg-card)', border: 'var(--border-width) solid var(--border-color)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box', transition: 'all 0.1s ease', boxShadow: 'var(--shadow-sm)'
};
const labelStyle = {
    fontSize: '0.72rem', fontWeight: 800,
    color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.6px'
};

const STEPS = ['Basic Info', 'Verify', 'Account Type', 'Profile'];

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState('');

    const [form, setForm] = useState({
        name: '', email: '', phone: '', password: '', confirmPassword: '',
        role: '', bloodGroup: '', city: '', district: '', dob: '',
        gender: '', weight: '', lastDonationDate: '', available: true,
        profilePicture: ''
    });
    const [profilePreview, setProfilePreview] = useState('');

    // Compress + resize image to 200x200 base64 before storing
    const resizeImage = (file) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const SIZE = 200;
                canvas.width = SIZE;
                canvas.height = SIZE;
                const ctx = canvas.getContext('2d');
                // Center-crop to square
                const min = Math.min(img.width, img.height);
                const sx = (img.width - min) / 2;
                const sy = (img.height - min) / 2;
                ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
                resolve(canvas.toDataURL('image/jpeg', 0.75));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return; }
        const base64 = await resizeImage(file);
        setProfilePreview(base64);
        update('profilePicture', base64);
    };

    const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    const getPasswordStrength = (pw) => {
        if (!pw) return { label: '', color: '', width: 0 };
        let score = 0;
        if (pw.length >= 8) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        const levels = [
            { label: 'Weak', color: '#E63946', width: 25 },
            { label: 'Fair', color: '#F8D24A', width: 50 },
            { label: 'Good', color: '#0284C7', width: 75 },
            { label: 'Strong', color: '#0D9488', width: 100 },
        ];
        return levels[score - 1] || levels[0];
    };

    const strength = getPasswordStrength(form.password);

    const handleStep0 = () => {
        if (!form.name || !form.email || !form.phone || !form.password) return setError('All fields required.');
        if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
        if (form.password.length < 8) return setError('Password must be at least 8 characters.');
        setError('');
        setStep(1);
    };

    const handleOTPVerify = () => {
        // Simulate OTP verification
        if (!otp) return setError('Enter the OTP code.');
        setError('');
        setStep(2);
    };

    const handleRoleSelect = (role) => {
        update('role', role);
        setStep(3);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.role) return setError('Select account type.');
        setLoading(true);
        setError('');
        try {
            const userData = {
                name: form.name, email: form.email, phone: form.phone,
                password: form.password, role: form.role,
                bloodGroup: form.bloodGroup, city: form.city,
                district: form.district, dob: form.dob,
                gender: form.gender,
                weight: form.weight ? parseFloat(form.weight) : null,
                lastDonationDate: form.lastDonationDate || null,
                available: form.available,
                profilePicture: form.profilePicture || ''
            };
            const user = await register(userData);
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'donor') navigate('/donor-dashboard');
            else navigate('/requester-dashboard');
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem 4rem', position: 'relative' }}>
            {/* Background */}
            <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(230,57,70,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', top: '10%', right: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(230,57,70,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

            <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: '1.5rem' }}>
                        <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src="/logo_transparent.png" alt="Blood Link Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <span style={{ fontWeight: 850, fontSize: '1.1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Blood<span style={{ color: '#dc2626' }}>Link</span></span>
                    </Link>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Create your account</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 650 }}>Join 60,000+ heroes saving lives every day</p>
                </div>

                {/* Step Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '2rem' }} className="step-indicator-wrapper">
                    {STEPS.map((s, i) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 900, fontSize: '0.8rem', fontFamily: 'var(--font-heading)',
                                    background: i < step ? 'var(--accent-green)' : i === step ? 'var(--primary)' : 'var(--bg-tertiary)',
                                    color: i < step ? '#000000' : i === step ? 'var(--text-white)' : 'var(--text-muted)',
                                    border: '2px solid var(--border-color)',
                                    boxShadow: i <= step ? '2px 2px 0px 0px var(--shadow-color)' : 'none',
                                    transition: 'all 0.2s ease'
                                }}>
                                    {i < step ? <CheckCircle2 style={{ width: 15, height: 15 }} /> : i + 1}
                                </div>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: i === step ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>{s}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div style={{ flex: 1, height: 2, background: 'var(--border-color)', margin: '0 6px', marginBottom: 20 }} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div style={{ background: 'var(--bg-card)', border: 'var(--border-width) solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '2rem', boxShadow: 'var(--shadow-md)' }}>
                    {error && (
                        <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', border: '2px solid var(--primary)', borderRadius: 'var(--radius-sm)', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 800, marginBottom: '1.25rem' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {/* ===== STEP 0: Basic Info ===== */}
                        {step === 0 && (
                            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                <h4 style={{ fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Basic Information</h4>

                                {/* Full Name */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    <label style={labelStyle}>Full Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <User style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        <input type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Your full name"
                                            style={inputStyle}
                                            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.transform = 'translate(-1px, -1px)'; e.target.style.boxShadow = 'var(--shadow-md)'; }}
                                            onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.transform = 'none'; e.target.style.boxShadow = 'var(--shadow-sm)'; }} />
                                    </div>
                                </div>

                                {/* Email */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    <label style={labelStyle}>Email Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com"
                                            style={inputStyle}
                                            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.transform = 'translate(-1px, -1px)'; e.target.style.boxShadow = 'var(--shadow-md)'; }}
                                            onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.transform = 'none'; e.target.style.boxShadow = 'var(--shadow-sm)'; }} />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    <label style={labelStyle}>Phone Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 98765 43210"
                                            style={inputStyle}
                                            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.transform = 'translate(-1px, -1px)'; e.target.style.boxShadow = 'var(--shadow-md)'; }}
                                            onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.transform = 'none'; e.target.style.boxShadow = 'var(--shadow-sm)'; }} />
                                    </div>
                                </div>

                                {/* Password */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    <label style={labelStyle}>Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder="Min 8 chars"
                                            style={{ ...inputStyle, paddingRight: 44 }}
                                            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.transform = 'translate(-1px, -1px)'; e.target.style.boxShadow = 'var(--shadow-md)'; }}
                                            onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.transform = 'none'; e.target.style.boxShadow = 'var(--shadow-sm)'; }} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                            {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                                        </button>
                                    </div>
                                    {form.password && (
                                        <div>
                                            <div style={{ height: 4, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
                                                <div style={{ height: '100%', width: `${strength.width}%`, background: strength.color, transition: 'all 0.3s ease' }} />
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: strength.color, fontWeight: 800, marginTop: 3 }}>{strength.label} password</div>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    <label style={labelStyle}>Confirm Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        <input type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="Confirm your password"
                                            style={{ ...inputStyle, borderColor: form.confirmPassword && form.confirmPassword !== form.password ? 'var(--primary)' : 'var(--border-color)' }}
                                            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.transform = 'translate(-1px, -1px)'; e.target.style.boxShadow = 'var(--shadow-md)'; }}
                                            onBlur={e => { e.target.style.borderColor = form.confirmPassword !== form.password ? 'var(--primary)' : 'var(--border-color)'; e.target.style.transform = 'none'; e.target.style.boxShadow = 'var(--shadow-sm)'; }} />
                                    </div>
                                </div>

                                <button type="button" onClick={handleStep0}
                                    style={{ height: 48, background: 'var(--primary)', color: 'var(--text-white)', border: 'var(--border-width) solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-heading)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.1s ease' }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                                    onMouseDown={e => { e.currentTarget.style.transform = 'translate(1px, 1px)'; e.currentTarget.style.boxShadow = '1px 1px 0px 0px var(--shadow-color)'; }}
                                    onMouseUp={e => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}>
                                    Continue <ArrowRight style={{ width: 16, height: 16 }} />
                                </button>

                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.5rem', fontWeight: 650 }}>
                                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 800 }}>Sign in</Link>
                                </p>
                            </motion.div>
                        )}

                        {/* ===== STEP 1: OTP Verification ===== */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center', textAlign: 'center' }}>
                                <div style={{ width: 68, height: 68, borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 0px 0px var(--shadow-color)' }}>
                                    <Phone style={{ width: 28, height: 28, color: 'var(--primary)' }} />
                                </div>
                                <div>
                                    <h4 style={{ fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontSize: '1.15rem', marginBottom: '0.375rem' }}>Verify Your Phone</h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Enter the 6-digit OTP sent to <strong style={{ color: 'var(--text-primary)' }}>{form.phone}</strong></p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4, fontWeight: 600 }}>(Demo: enter any 6 digits)</p>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', width: '100%' }}>
                                    {[0,1,2,3,4,5].map(i => (
                                        <input key={i} type="text" maxLength={1}
                                            value={otp[i] || ''}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                const newOtp = (otp + '      ').split('');
                                                newOtp[i] = val;
                                                setOtp(newOtp.slice(0, 6).join('').trim());
                                                if (val && e.target.nextSibling) e.target.nextSibling.focus();
                                            }}
                                            onKeyDown={e => { if (e.key === 'Backspace' && !otp[i] && e.target.previousSibling) e.target.previousSibling.focus(); }}
                                            style={{ width: 48, height: 56, textAlign: 'center', background: 'var(--bg-card)', border: 'var(--border-width) solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 900, outline: 'none', fontFamily: 'var(--font-heading)', boxShadow: 'var(--shadow-sm)' }} />
                                    ))}
                                </div>

                                <button type="button" onClick={handleOTPVerify}
                                    style={{ width: '100%', height: 48, background: 'var(--accent-green)', color: '#000000', border: 'var(--border-width) solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'var(--font-heading)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.1s ease' }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                                    onMouseDown={e => { e.currentTarget.style.transform = 'translate(1px, 1px)'; e.currentTarget.style.boxShadow = '1px 1px 0px 0px var(--shadow-color)'; }}
                                    onMouseUp={e => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}>
                                    Verify OTP
                                </button>

                                <button type="button" onClick={() => setStep(0)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.825rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                                    <ArrowLeft style={{ width: 14, height: 14 }} /> Back
                                </button>
                            </motion.div>
                        )}

                        {/* ===== STEP 2: Role Selection ===== */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                                    <h4 style={{ fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: 4 }}>Choose Account Type</h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', fontWeight: 650 }}>How would you like to use Blood Link?</p>
                                </div>

                                {[
                                    { role: 'donor', icon: Heart, title: 'I am a Donor', desc: 'I want to donate blood and save lives', color: 'var(--primary)', badge: 'Earn Rewards' },
                                    { role: 'requester', icon: Activity, title: 'I Need Blood', desc: 'I want to find donors for myself or family', color: 'var(--accent-blue)', badge: 'Find Fast' },
                                ].map(({ role, icon: Icon, title, desc, color, badge }) => (
                                    <button key={role} type="button" onClick={() => handleRoleSelect(role)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.125rem 1.25rem', background: 'var(--bg-card)', border: 'var(--border-width) solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s ease', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                                        <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '2px 2px 0px 0px var(--border-color)' }}>
                                            <Icon style={{ width: 22, height: 22, color }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: '0.95rem', fontFamily: 'var(--font-heading)', marginBottom: 2 }}>{title}</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>{desc}</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                            <span style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '2px solid var(--border-color)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.68rem', fontWeight: 800, boxShadow: '2px 2px 0px 0px var(--border-color)' }}>{badge}</span>
                                            <ChevronRight style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
                                        </div>
                                    </button>
                                ))}

                                <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.825rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: '0.25rem', fontWeight: 700 }}>
                                    <ArrowLeft style={{ width: 14, height: 14 }} /> Back
                                </button>
                            </motion.div>
                        )}

                        {/* ===== STEP 3: Profile Details ===== */}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                    <h4 style={{ fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                                        {form.role === 'donor' ? '🩸 Donor Profile' : '🏥 Your Details'}
                                    </h4>

                                    {/* Profile Photo Upload */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
                                        <input
                                            type="file" id="profilePicInput" accept="image/*"
                                            onChange={handleImageChange}
                                            style={{ display: 'none' }}
                                        />
                                        <label htmlFor="profilePicInput" style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}>
                                            <div style={{
                                                width: 88, height: 88, borderRadius: '50%',
                                                background: profilePreview ? 'transparent' : 'var(--primary-light)',
                                                border: '3px solid var(--primary)',
                                                overflow: 'hidden',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: 'var(--shadow-md)',
                                                transition: 'opacity 0.2s'
                                            }}>
                                                {profilePreview ? (
                                                    <img src={profilePreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ fontWeight: 900, fontSize: '2rem', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                                                        {form.name ? form.name.charAt(0).toUpperCase() : '?'}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Camera overlay */}
                                            <div style={{
                                                position: 'absolute', bottom: 0, right: 0,
                                                width: 26, height: 26, borderRadius: '50%',
                                                background: 'var(--primary)', border: '2px solid var(--bg-card)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Camera style={{ width: 13, height: 13, color: '#ffffff' }} />
                                            </div>
                                        </label>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                            {profilePreview ? 'Tap to change photo' : 'Add profile photo (optional)'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                        {/* City */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <label style={labelStyle}>City</label>
                                            <div style={{ position: 'relative' }}>
                                                <MapPin style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                                <select value={form.city} onChange={e => update('city', e.target.value)}
                                                    style={{ ...inputStyle, paddingLeft: 34, appearance: 'none', cursor: 'pointer' }}>
                                                    <option value="" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Select city</option>
                                                    {cities.map(c => <option key={c} value={c} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{c}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>

                                        {/* Blood Group */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <label style={labelStyle}>Blood Group</label>
                                            <select required={form.role === 'donor'} value={form.bloodGroup} onChange={e => update('bloodGroup', e.target.value)}
                                                style={{ ...inputStyle, paddingLeft: 14, appearance: 'none', cursor: 'pointer' }}>
                                                <option value="" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Select group</option>
                                                {bloodGroups.map(bg => <option key={bg} value={bg} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{bg}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {form.role === 'donor' && (
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                {/* Gender */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                    <label style={labelStyle}>Gender</label>
                                                    <select value={form.gender} onChange={e => update('gender', e.target.value)}
                                                        style={{ ...inputStyle, paddingLeft: 14, appearance: 'none', cursor: 'pointer' }}>
                                                        <option value="" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Select</option>
                                                        <option value="male" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Male</option>
                                                        <option value="female" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Female</option>
                                                        <option value="other" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Other</option>
                                                    </select>
                                                </div>

                                                {/* Weight */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                    <label style={labelStyle}>Weight (kg)</label>
                                                    <input type="number" min="45" value={form.weight} onChange={e => update('weight', e.target.value)} placeholder="Min 45 kg"
                                                        style={{ ...inputStyle, paddingLeft: 14 }}
                                                        onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.transform = 'translate(-1px, -1px)'; e.target.style.boxShadow = 'var(--shadow-md)'; }}
                                                        onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.transform = 'none'; e.target.style.boxShadow = 'var(--shadow-sm)'; }} />
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                {/* DOB */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                    <label style={labelStyle}>Date of Birth</label>
                                                    <div style={{ position: 'relative' }}>
                                                        <Calendar style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                                        <input type="date" value={form.dob} onChange={e => update('dob', e.target.value)}
                                                            style={{ ...inputStyle, colorScheme: 'light' }} />
                                                    </div>
                                                </div>

                                                {/* Last Donation */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                    <label style={labelStyle}>Last Donation</label>
                                                    <input type="date" value={form.lastDonationDate} onChange={e => update('lastDonationDate', e.target.value)}
                                                        style={{ ...inputStyle, paddingLeft: 14, colorScheme: 'light' }} />
                                                </div>
                                            </div>

                                            {/* Availability */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', border: 'var(--border-width) solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem', boxShadow: 'var(--shadow-sm)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Shield style={{ width: 16, height: 16, color: '#0D9488' }} />
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.875rem' }}>Available to Donate</div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>Toggle your donation availability</div>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => update('available', !form.available)}
                                                    style={{ width: 44, height: 24, borderRadius: 100, background: form.available ? 'var(--accent-green)' : 'var(--bg-tertiary)', border: '2px solid var(--border-color)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s ease', boxShadow: '2px 2px 0px 0px var(--shadow-color)' }}>
                                                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--text-primary)', position: 'absolute', top: 3, left: form.available ? 23 : 3, transition: 'left 0.2s ease' }} />
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    <motion.button type="submit" disabled={loading}
                                        style={{ height: 50, background: 'var(--primary)', color: 'var(--text-white)', border: 'var(--border-width) solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontWeight: 900, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-heading)', boxShadow: 'var(--shadow-sm)', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '0.5rem', transition: 'all 0.1s ease' }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                                        onMouseDown={e => { e.currentTarget.style.transform = 'translate(1px, 1px)'; e.currentTarget.style.boxShadow = '1px 1px 0px 0px var(--shadow-color)'; }}
                                        onMouseUp={e => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}>
                                        {loading ? <><Loader2 style={{ width: 17, height: 17, animation: 'spin 1s linear infinite' }} /> Creating account...</> : '🎉 Complete Registration'}
                                    </motion.button>

                                    <button type="button" onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.825rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontWeight: 700 }}>
                                        <ArrowLeft style={{ width: 14, height: 14 }} /> Back
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1.25rem', lineHeight: 1.6, fontWeight: 650 }}>
                    By registering, you agree to our{' '}
                    <Link to="/terms" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>Terms</Link> &{' '}
                    <Link to="/privacy" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>Privacy Policy</Link>
                </p>
            </div>
        </div>
    );
}
