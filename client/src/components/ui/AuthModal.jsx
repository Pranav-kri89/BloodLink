import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { X, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GoogleIcon = (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
        <path
            fill="#ea4335"
            d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.555 0-6.437-2.882-6.437-6.437 0-3.555 2.882-6.437 6.437-6.437 1.577 0 3.01.574 4.12 1.518l3.078-3.078C18.995 2.05 15.827 1 12.24 1 5.922 1 1 5.922 1 12.24s4.922 11.24 11.24 11.24c6.236 0 10.748-4.382 10.748-10.748 0-.725-.065-1.423-.187-2.09-.01 0-10.561-.362-10.561-.362z"
        />
    </svg>
);

export default function AuthModal({ isOpen, onClose, onSuccess }) {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    
    const [mode, setMode] = useState('select'); // 'select', 'login', 'register', 'phone'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await register({
                name,
                email,
                phone,
                password,
                role: 'requester' // Default role for immediate request
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        // Mock Google login
        setTimeout(() => {
            login('demo@google.com', 'Pranav@26')
                .then(() => {
                    if (onSuccess) onSuccess();
                    onClose();
                })
                .catch((err) => setError('Google sign-in simulation failed'))
                .finally(() => setLoading(false));
        }, 1000);
    };

    const handlePhoneSubmit = (e) => {
        e.preventDefault();
        setOtpSent(true);
    };

    const handleOtpVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        // Mock phone OTP verify and auto-register or login
        setTimeout(() => {
            login('bloodlink24x7@gmail.com', 'Pranav@26')
                .then(() => {
                    if (onSuccess) onSuccess();
                    onClose();
                })
                .catch((err) => setError('Invalid OTP. Please enter 123456.'))
                .finally(() => setLoading(false));
        }, 1000);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-lg)] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold font-heading text-[var(--text-primary)]">Continue to request</h3>
                            <p className="text-sm text-[var(--text-muted)] mt-1">Please sign in to complete your request</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-[var(--primary)] text-sm rounded-[var(--radius-sm)] font-medium">
                            {error}
                        </div>
                    )}

                    {/* Mode selection */}
                    {mode === 'select' && (
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => setMode('login')}
                                className="flex items-center justify-center gap-3 w-full h-12 border border-[var(--border-color)] hover:border-[var(--primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-[var(--radius-md)] font-semibold transition-all"
                            >
                                <Mail className="w-5 h-5 text-[var(--primary)]" />
                                Continue with Email
                            </button>

                            <button 
                                onClick={() => setMode('phone')}
                                className="flex items-center justify-center gap-3 w-full h-12 border border-[var(--border-color)] hover:border-[var(--primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-[var(--radius-md)] font-semibold transition-all"
                            >
                                <Phone className="w-5 h-5 text-[var(--accent-green)]" />
                                Continue with Phone OTP
                            </button>

                            <button 
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="flex items-center justify-center gap-3 w-full h-12 border border-[var(--border-color)] hover:border-[var(--primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-[var(--radius-md)] font-semibold transition-all disabled:opacity-50"
                            >
                                <GoogleIcon className="w-5 h-5" />
                                {loading ? 'Loading...' : 'Continue with Google'}
                            </button>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-[var(--border-color)]"></div>
                                <span className="flex-shrink mx-4 text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">or</span>
                                <div className="flex-grow border-t border-[var(--border-color)]"></div>
                            </div>

                            <button 
                                onClick={() => setMode('register')}
                                className="w-full h-12 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[var(--radius-md)] font-semibold transition-all"
                            >
                                Register New Account
                            </button>
                        </div>
                    )}

                    {/* Login form */}
                    {mode === 'login' && (
                        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Email Address</label>
                                <input 
                                    type="email" 
                                    placeholder="yourname@gmail.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-11 px-4 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors text-sm"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Password</label>
                                <input 
                                    type="password" 
                                    placeholder="Enter your password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-11 px-4 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors text-sm"
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full h-12 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[var(--radius-md)] font-semibold transition-all disabled:opacity-50 mt-2"
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setMode('select')}
                                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] text-center mt-2 underline"
                            >
                                Back to options
                            </button>
                        </form>
                    )}

                    {/* Register form */}
                    {mode === 'register' && (
                        <form onSubmit={handleEmailRegister} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Full Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter full name" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full h-11 px-4 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors text-sm"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Email Address</label>
                                <input 
                                    type="email" 
                                    placeholder="yourname@gmail.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-11 px-4 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors text-sm"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Phone Number</label>
                                <input 
                                    type="tel" 
                                    placeholder="Phone number" 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full h-11 px-4 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors text-sm"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Password</label>
                                <input 
                                    type="password" 
                                    placeholder="Min 8 characters" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-11 px-4 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors text-sm"
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full h-12 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[var(--radius-md)] font-semibold transition-all disabled:opacity-50 mt-2"
                            >
                                {loading ? 'Creating account...' : 'Create Account'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setMode('select')}
                                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] text-center mt-2 underline"
                            >
                                Back to options
                            </button>
                        </form>
                    )}

                    {/* Phone verification form */}
                    {mode === 'phone' && (
                        <div className="flex flex-col gap-4">
                            {!otpSent ? (
                                <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Phone Number</label>
                                        <input 
                                            type="tel" 
                                            placeholder="Enter phone number" 
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full h-11 px-4 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors text-sm"
                                            required
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="w-full h-12 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[var(--radius-md)] font-semibold transition-all"
                                    >
                                        Send Verification OTP
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleOtpVerify} className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Enter OTP (Demo: 123456)</label>
                                        <input 
                                            type="text" 
                                            maxLength={6}
                                            placeholder="Enter 6-digit OTP" 
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            className="w-full h-11 px-4 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none text-center tracking-[4px] font-bold focus:border-[var(--primary)] transition-colors text-sm"
                                            required
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full h-12 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[var(--radius-md)] font-semibold transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'Verifying...' : 'Verify & Continue'}
                                    </button>
                                </form>
                            )}
                            <button 
                                type="button" 
                                onClick={() => { setMode('select'); setOtpSent(false); }}
                                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] text-center mt-2 underline"
                            >
                                Back to options
                            </button>
                        </div>
                    )}

                </motion.div>
            </div>
        </AnimatePresence>
    );
}
