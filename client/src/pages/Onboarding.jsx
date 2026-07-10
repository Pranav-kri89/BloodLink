import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Droplets, MapPin, Phone, User as UserIcon, Calendar, Home, Camera, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';

const cities = [
    'Bantwal', 'Kanhangad', 'Kasaragod', 'Kumbla', 'Mangaluru', 
    'Manipal', 'Manjeshwar', 'Nileshwar', 'Puttur', 'Udupi'
];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Onboarding() {
    const navigate = useNavigate();
    const { loadUser } = useAuth();
    const { getToken } = useClerkAuth();
    
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        role: 'donor',
        bloodGroup: '',
        city: '',
        address: '',
        phone: '',
        dob: '',
        profilePicture: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [profilePreview, setProfilePreview] = useState(null);

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
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setError('Image size must be less than 2MB');
                return;
            }
            const base64 = await resizeImage(file);
            setForm(prev => ({ ...prev, profilePicture: base64 }));
            setProfilePreview(base64);
        }
    };

    const handleNext = (e) => {
        e.preventDefault();
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            if (!form.bloodGroup || !form.dob) {
                setError('Please fill all required fields');
                return;
            }
            setError('');
            setStep(3);
        }
    };

    const handleBack = () => {
        setError('');
        setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.city || !form.address || !form.phone) {
            setError('Please fill all required fields');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const clerkToken = await getToken();
            const config = { headers: { Authorization: `Bearer ${clerkToken}` } };
            await axios.post('/api/auth/sync', form, config);
            
            // Reload user context to remove onboardingRequired flag
            await loadUser();
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to complete onboarding');
        } finally {
            setSubmitting(false);
        }
    };

    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 30 : -30,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 30 : -30,
            opacity: 0,
            position: 'absolute',
            width: '100%'
        })
    };

    const direction = 1; // Simplify for now

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-body)', padding: '2rem' }}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--bg-card)', padding: '2.5rem', borderRadius: 16, boxShadow: 'var(--shadow-lg)', maxWidth: 500, width: '100%', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}
            >
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: '2.5rem' }}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ 
                                width: 34, height: 34, borderRadius: '50%', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: step >= i ? 'var(--primary)' : 'var(--bg-secondary)',
                                color: step >= i ? '#fff' : 'var(--text-muted)',
                                fontWeight: 700, fontSize: '0.9rem',
                                transition: 'all 0.3s ease',
                                border: step >= i ? 'none' : '1px solid var(--border-color)'
                            }}>
                                {step > i ? <Check size={18} strokeWidth={3} /> : i}
                            </div>
                            {i < 3 && (
                                <div style={{ 
                                    width: 40, height: 3, 
                                    background: step > i ? 'var(--primary)' : 'var(--bg-secondary)',
                                    margin: '0 8px', transition: 'all 0.3s ease', borderRadius: 4
                                }} />
                            )}
                        </div>
                    ))}
                </div>

                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', textAlign: 'center' }}>
                    {step === 1 ? 'Welcome to BloodLink!' : step === 2 ? 'Personal Details' : 'Contact Info'}
                </h2>
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
                    {step === 1 ? 'Let\'s set up your profile.' : step === 2 ? 'Tell us a bit about yourself.' : 'How can we reach you?'}
                </p>

                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#FEE2E2', color: '#DC2626', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                        {error}
                    </motion.div>
                )}

                <form onSubmit={step === 3 ? handleSubmit : handleNext} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                    
                    <AnimatePresence mode="wait" custom={direction}>
                        {step === 1 && (
                            <motion.div key="step1" initial="enter" animate="center" exit="exit" variants={slideVariants} custom={direction} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {/* Profile Picture Upload */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                    <div style={{ position: 'relative', width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-secondary)', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {profilePreview ? (
                                            <img src={profilePreview} alt="Profile Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <Camera style={{ width: 32, height: 32, color: 'var(--text-muted)' }} />
                                        )}
                                        <input 
                                            type="file" accept="image/*" onChange={handleImageChange}
                                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                        />
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                        Upload Profile Picture (Optional)
                                    </div>
                                </div>

                                {/* Role */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>I want to be a</label>
                                    <div style={{ position: 'relative' }}>
                                        <UserIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-muted)' }} />
                                        <select required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                                            style={{ width: '100%', height: 48, paddingLeft: 42, paddingRight: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none' }}>
                                            <option value="donor">Donor (I want to donate blood)</option>
                                            <option value="requester">Requester (I need blood)</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial="enter" animate="center" exit="exit" variants={slideVariants} custom={direction} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {/* Blood Group */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Blood Group *</label>
                                    <div style={{ position: 'relative' }}>
                                        <Droplets style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-muted)' }} />
                                        <select required value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
                                            style={{ width: '100%', height: 48, paddingLeft: 42, paddingRight: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none' }}>
                                            <option value="">Select Blood Group</option>
                                            {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                        </select>
                                    </div>
                                </div>
                                
                                {/* DOB */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Date of Birth *</label>
                                    <div style={{ position: 'relative' }}>
                                        <Calendar style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-muted)' }} />
                                        <input type="date" required value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })}
                                            style={{ width: '100%', height: 48, paddingLeft: 42, paddingRight: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial="enter" animate="center" exit="exit" variants={slideVariants} custom={direction} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {/* City */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>City *</label>
                                    <div style={{ position: 'relative' }}>
                                        <MapPin style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-muted)' }} />
                                        <select required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                                            style={{ width: '100%', height: 48, paddingLeft: 42, paddingRight: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none' }}>
                                            <option value="">Select City</option>
                                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Address */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Full Address *</label>
                                    <div style={{ position: 'relative' }}>
                                        <Home style={{ position: 'absolute', left: 14, top: 14, width: 18, height: 18, color: 'var(--text-muted)' }} />
                                        <textarea required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                                            placeholder="Enter your full address"
                                            style={{ width: '100%', minHeight: 80, padding: '14px 16px 14px 42px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Phone Number *</label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-muted)' }} />
                                        <input type="tel" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                            placeholder="Enter your mobile number"
                                            style={{ width: '100%', height: 48, paddingLeft: 42, paddingRight: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        {step > 1 && (
                            <button type="button" onClick={handleBack}
                                style={{ flex: 1, height: 50, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 12, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <ChevronLeft size={20} /> Back
                            </button>
                        )}
                        <button type="submit" disabled={submitting}
                            style={{ flex: 2, height: 50, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s ease' }}>
                            {step < 3 ? (
                                <>Next <ChevronRight size={20} /></>
                            ) : (
                                submitting ? 'Saving...' : 'Complete Profile'
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
