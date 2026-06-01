import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'donor',
        bloodGroup: '',
        city: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState('');
    const [countdown, setCountdown] = useState(0);
    const { register } = useAuth();
    const navigate = useNavigate();

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const cities = ['Bantwal', 'Belthangady', 'Dharmasthala', 'Kadaba', 'Kanhangad', 'Kasaragod', 'Kundapura', 'Mangaluru', 'Manjeshwar', 'Manipal', 'Moodbidri', 'Mulki', 'Puttur', 'Sullia', 'Surathkal', 'Udupi', 'Uppala', 'Vitla'];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Password strength checker
    const getPasswordStrength = (password) => {
        let score = 0;
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        score = Object.values(checks).filter(Boolean).length;

        let label = '';
        let color = '';
        if (score <= 1) { label = 'Very Weak'; color = '#F44336'; }
        else if (score === 2) { label = 'Weak'; color = '#FF9800'; }
        else if (score === 3) { label = 'Fair'; color = '#FFC107'; }
        else if (score === 4) { label = 'Strong'; color = '#8BC34A'; }
        else { label = 'Very Strong'; color = '#4CAF50'; }

        return { score, checks, label, color };
    };

    const strength = getPasswordStrength(formData.password);

    // Countdown timer for OTP resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSendOTP = async () => {
        if (!formData.phone || formData.phone.length < 10) {
            setOtpMessage('Please enter a valid phone number');
            return;
        }
        setOtpLoading(true);
        setOtpMessage('');
        try {
            const res = await axios.post('/api/otp/send', { phone: formData.phone });
            setOtpSent(true);
            setCountdown(60);
            if (res.data.demo && res.data.otp) {
                setOtpMessage(`Demo mode: Your OTP is ${res.data.otp}`);
            } else {
                setOtpMessage('OTP sent to your phone!');
            }
        } catch (err) {
            setOtpMessage(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otpValue || otpValue.length !== 6) {
            setOtpMessage('Please enter the 6-digit OTP');
            return;
        }
        setOtpLoading(true);
        try {
            await axios.post('/api/otp/verify', { phone: formData.phone, otp: otpValue });
            setPhoneVerified(true);
            setOtpMessage('Phone verified successfully!');
        } catch (err) {
            setOtpMessage(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (strength.score < 3) {
            setError('Password is too weak. Include uppercase, lowercase, numbers, and special characters.');
            return;
        }

        if (!phoneVerified) {
            setError('Please verify your phone number with OTP first.');
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword, ...userData } = formData;
            const user = await register(userData);
            if (user.role === 'donor') {
                navigate('/donor-dashboard');
            } else {
                navigate('/search');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const eyeIcon = (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    );

    const eyeOffIcon = (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
    );

    return (
        <div className="auth-page">
            <div className="auth-card fade-in">
                <div className="logo-top">&#129656;</div>
                <h1>Create Account</h1>
                <p className="auth-subtitle">Join BloodConnect and help save lives</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            className="form-control"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    className="form-control"
                                    placeholder="Min 8 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    style={{ paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                                >
                                    {showPassword ? eyeOffIcon : eyeIcon}
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    name="confirmPassword"
                                    className="form-control"
                                    placeholder="Confirm password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    style={{ paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                                >
                                    {showConfirm ? eyeOffIcon : eyeIcon}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Password Strength Meter */}
                    {formData.password && (
                        <div style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} style={{
                                        flex: 1, height: '4px', borderRadius: '2px',
                                        background: i <= strength.score ? strength.color : 'rgba(0,0,0,0.08)',
                                        transition: 'all 0.3s ease'
                                    }}></div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: strength.color }}>{strength.label}</span>
                                <div style={{ display: 'flex', gap: '6px', fontSize: '0.7rem' }}>
                                    <span style={{ color: strength.checks.uppercase ? '#4CAF50' : 'var(--text-muted)' }}>A-Z</span>
                                    <span style={{ color: strength.checks.lowercase ? '#4CAF50' : 'var(--text-muted)' }}>a-z</span>
                                    <span style={{ color: strength.checks.number ? '#4CAF50' : 'var(--text-muted)' }}>0-9</span>
                                    <span style={{ color: strength.checks.special ? '#4CAF50' : 'var(--text-muted)' }}>!@#</span>
                                    <span style={{ color: strength.checks.length ? '#4CAF50' : 'var(--text-muted)' }}>8+</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Phone Number {phoneVerified && <span style={{ color: '#4CAF50', fontSize: '0.8rem', fontWeight: 600 }}>Verified</span>}</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="tel"
                                name="phone"
                                className="form-control"
                                placeholder="Enter 10-digit phone number"
                                value={formData.phone}
                                onChange={(e) => {
                                    handleChange(e);
                                    if (phoneVerified) {
                                        setPhoneVerified(false);
                                        setOtpSent(false);
                                        setOtpValue('');
                                        setOtpMessage('');
                                    }
                                }}
                                required
                                disabled={phoneVerified}
                                style={{ flex: 1, ...(phoneVerified ? { borderColor: '#4CAF50', opacity: 0.8 } : {}) }}
                            />
                            {!phoneVerified && (
                                <button
                                    type="button"
                                    onClick={handleSendOTP}
                                    disabled={otpLoading || countdown > 0 || !formData.phone || formData.phone.length < 10}
                                    style={{
                                        padding: '0 16px',
                                        background: countdown > 0 ? 'var(--bg-tertiary)' : 'var(--primary)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                        minWidth: '100px'
                                    }}
                                >
                                    {otpLoading ? 'Sending...' : countdown > 0 ? `Resend (${countdown}s)` : otpSent ? 'Resend OTP' : 'Send OTP'}
                                </button>
                            )}
                        </div>

                        {/* OTP Input */}
                        {otpSent && !phoneVerified && (
                            <div style={{ marginTop: '10px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter 6-digit OTP"
                                        value={otpValue}
                                        onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength={6}
                                        style={{ flex: 1, letterSpacing: '6px', fontSize: '1.1rem', textAlign: 'center', fontWeight: 700 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleVerifyOTP}
                                        disabled={otpLoading || otpValue.length !== 6}
                                        style={{
                                            padding: '0 16px',
                                            background: '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: otpValue.length !== 6 ? 'not-allowed' : 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            minWidth: '80px'
                                        }}
                                    >
                                        {otpLoading ? '...' : 'Verify'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* OTP Message */}
                        {otpMessage && (
                            <p style={{ marginTop: '6px', fontSize: '0.8rem', color: phoneVerified ? '#4CAF50' : otpMessage.includes('Demo') || otpMessage.includes('sent') ? '#FF9800' : '#F44336' }}>
                                {otpMessage}
                            </p>
                        )}
                    </div>



                            <div className="form-row">
                                <div className="form-group">
                                    <label>Blood Group</label>
                                    <select
                                        name="bloodGroup"
                                        className="form-control"
                                        value={formData.bloodGroup}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select</option>
                                        {bloodGroups.map(bg => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>City</label>
                                    <select
                                        name="city"
                                        className="form-control"
                                        value={formData.city}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select City</option>
                                        {cities.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
