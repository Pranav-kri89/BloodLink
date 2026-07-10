import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from '../components/ui/AuthModal';
import {
    Search, MapPin, Droplets, Star, Clock, ShieldCheck,
    Filter, SlidersHorizontal, Zap, X, ChevronDown, Users,
    Loader2, AlertTriangle, Radio, Activity, Heart
} from 'lucide-react';

import { useLocation } from 'react-router-dom';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const cities = [
    'Bantwal', 'Kanhangad', 'Kasaragod', 'Kumbla', 'Mangaluru', 
    'Manipal', 'Manjeshwar', 'Nileshwar', 'Puttur', 'Udupi'
];

const cityHospitalsMap = {
    'Mangaluru': [
        'A.J. Hospital & Research Centre',
        'Father Muller Medical College Hospital',
        'Indiana Hospital & Heart Institute',
        'KMC Hospital',
        'Omega Hospital',
        'SCS Hospital',
        'Unity Hospital',
        'Yenepoya Hospital'
    ],
    'Udupi': [
        'Adarsha Hospital',
        'Lombard Memorial Hospital',
        'District Hospital Udupi'
    ],
    'Manipal': [
        'Kasturba Hospital (KMC)',
        'TMA Pai Hospital'
    ],
    'Kasaragod': [
        'Carewell Hospital',
        'General Hospital',
        'Kims Hospital',
        'Sunrise Hospital',
        'United Hospital'
    ],
    'Puttur': [
        'Mahaveera Hospital',
        'Pragathi Specialty Hospital',
        'Government Hospital Puttur'
    ],
    'Bantwal': [
        'Government Hospital Bantwal',
        'Sparsha Hospital Bantwal'
    ],
    'Kanhangad': [
        'Mansoor Hospital',
        'District Hospital Kanhangad',
        'Sanjeevani Hospital'
    ],
    'Nileshwar': [
        'Taluk Hospital Nileshwar',
        'Thejaswini Hospital'
    ],
    'Kumbla': [
        'Kumbla Cooperative Hospital',
        'Community Health Centre Kumbla'
    ],
    'Manjeshwar': [
        'CHC Manjeshwar',
        'Saamudayika Arogya Kendra'
    ]
};

// Skeleton Card
const SkeletonCard = () => (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-tertiary)' }} className="skeleton" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ height: 14, width: '60%', borderRadius: 4, background: 'var(--bg-tertiary)' }} className="skeleton" />
                <div style={{ height: 12, width: '40%', borderRadius: 4, background: 'var(--bg-tertiary)' }} className="skeleton" />
            </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 22, width: 60, borderRadius: 6, background: 'var(--bg-tertiary)' }} className="skeleton" />)}
        </div>
        <div style={{ height: 40, borderRadius: 10, background: 'var(--bg-tertiary)' }} className="skeleton" />
    </div>
);

// Donor Card - Anonymous, shows no PII
const DonorCard = ({ donor, onRequest, index }) => {
    const lastDonationDays = donor.lastDonationDate
        ? Math.floor((Date.now() - new Date(donor.lastDonationDate)) / (1000 * 60 * 60 * 24))
        : null;
    const totalDonations = donor.points ? Math.floor(donor.points / 50) : 0;
    const responseRate = donor.responseRate || 0;
    const rating = donor.rating || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.4 }}
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
            }}
            whileHover={{ borderColor: 'rgba(230, 57, 70, 0.3)', boxShadow: '0 8px 32px rgba(230, 57, 70, 0.08)', y: -2 }}
        >
            {/* Subtle gradient accent top */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: donor.available ? 'linear-gradient(90deg, #E63946, #FF5A5F)' : 'var(--bg-tertiary)', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                    {/* Avatar (Photo or Initials) */}
                    <div style={{
                        width: 46, height: 46, borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(230,57,70,0.2), rgba(255,90,95,0.1))',
                        border: '1.5px solid rgba(230,57,70,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)',
                        fontFamily: 'var(--font-heading)',
                        overflow: 'hidden'
                    }}>
                        {donor.profilePicture ? (
                            <img src={donor.profilePicture} alt={donor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            donor.name?.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                {donor.name} {donor.isCurrentUser && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>(You)</span>}
                            </span>
                            {donor.isVerified && (
                                <ShieldCheck style={{ width: 15, height: 15, color: '#0D9488' }} />
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            <MapPin style={{ width: 11, height: 11 }} />
                            <span>{donor.city}</span>
                        </div>
                    </div>
                </div>

                {/* Blood Group Badge */}
                <div style={{
                    background: 'rgba(230, 57, 70, 0.12)',
                    border: '1px solid rgba(230, 57, 70, 0.2)',
                    borderRadius: 10, padding: '4px 12px',
                    fontWeight: 800, fontSize: '1rem', color: 'var(--primary)',
                    fontFamily: 'var(--font-heading)', letterSpacing: '-0.5px'
                }}>
                    {donor.bloodGroup}
                </div>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.2)', padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.3px' }}>
                    ✓ VERIFIED
                </span>
                {donor.available && (
                    <span style={{ background: 'rgba(248,210,74,0.1)', color: '#F8D24A', border: '1px solid rgba(248,210,74,0.2)', padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600 }}>
                        ⚡ AVAILABLE
                    </span>
                )}
                {responseRate > 90 && (
                    <span style={{ background: 'rgba(2,132,199,0.1)', color: '#0284C7', border: '1px solid rgba(2,132,199,0.2)', padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600 }}>
                        🚀 FAST RESPONSE
                    </span>
                )}
            </div>

            {/* Stats Row */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8,
                borderTop: '1px solid var(--border-color)', paddingTop: '0.875rem'
            }}>
                {[
                    { label: 'Donations', value: totalDonations, icon: <Droplets style={{ width: 12, height: 12 }} /> },
                    { label: 'Response', value: responseRate ? `${responseRate}%` : '—', icon: <Zap style={{ width: 12, height: 12 }} /> },
                    { label: 'Rating', value: rating ? `${rating}★` : '—', icon: <Star style={{ width: 12, height: 12 }} /> }
                ].map(stat => (
                    <div key={stat.label} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, color: 'var(--text-muted)', fontSize: '0.68rem', marginBottom: 2 }}>
                            {stat.icon} {stat.label}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Last Donated */}
            {lastDonationDays !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <Clock style={{ width: 11, height: 11 }} />
                    Last donated {lastDonationDays} days ago
                </div>
            )}

            {/* CTA */}
            <button
                onClick={() => onRequest(donor)}
                disabled={!donor.available || donor.isCurrentUser}
                style={{
                    width: '100%', height: 42, borderRadius: 'var(--radius-sm)',
                    background: donor.isCurrentUser ? 'var(--bg-tertiary)' : (donor.available ? 'linear-gradient(135deg, #E63946, #FF5A5F)' : 'var(--bg-tertiary)'),
                    color: donor.isCurrentUser ? 'var(--text-muted)' : (donor.available ? '#fff' : 'var(--text-muted)'),
                    border: 'none', cursor: (donor.available && !donor.isCurrentUser) ? 'pointer' : 'not-allowed',
                    fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.3px',
                    transition: 'all 0.2s ease', fontFamily: 'var(--font-heading)'
                }}
                onMouseEnter={e => (donor.available && !donor.isCurrentUser) && (e.target.style.transform = 'scale(1.02)')}
                onMouseLeave={e => (e.target.style.transform = 'scale(1)')}
            >
                {donor.isCurrentUser ? '👤 This is You' : (donor.available ? '🩸 Request Blood' : 'Currently Unavailable')}
            </button>
        </motion.div>
    );
};

// Request Blood Modal
const RequestModal = ({ isOpen, onClose, onSubmit, form, setForm, submitting, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ overflowY: 'auto' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 24 }}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                style={{
                    position: 'relative', width: '100%', maxWidth: 540,
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)', padding: '2rem',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto'
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E63946', animation: 'pulse-dot 1.5s infinite' }} />
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Emergency Request</span>
                        </div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                            Request Blood
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>Matching donors will be notified immediately</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X style={{ width: 16, height: 16 }} />
                    </button>
                </div>

                {message.text && (
                    <div style={{
                        padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1.25rem',
                        background: message.type === 'success' ? 'rgba(13,148,136,0.1)' : 'rgba(230,57,70,0.1)',
                        border: `1px solid ${message.type === 'success' ? 'rgba(13,148,136,0.25)' : 'rgba(230,57,70,0.25)'}`,
                        color: message.type === 'success' ? '#0D9488' : 'var(--primary)', fontSize: '0.85rem', fontWeight: 600
                    }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                        {/* Patient Name */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patient Name *</label>
                            <input type="text" required value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })}
                                style={{ height: 42, padding: '0 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
                                placeholder="Patient full name" />
                        </div>

                        {/* Blood Group */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Blood Group *</label>
                            <select required value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
                                style={{ height: 42, padding: '0 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}>
                                <option value="">Select group</option>
                                {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                            </select>
                        </div>
                        
                        {/* City */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>City *</label>
                            <select required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                                style={{ height: 42, padding: '0 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}>
                                <option value="">Select city</option>
                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Units */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Units Needed *</label>
                            <input type="number" min="1" max="10" required value={form.unitsNeeded} onChange={e => setForm({ ...form, unitsNeeded: parseInt(e.target.value) })}
                                style={{ height: 42, padding: '0 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }} />
                        </div>
                    </div>

                    {/* Hospital */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hospital *</label>
                        <input type="text" list="hospitals" required value={form.hospital} onChange={e => setForm({ ...form, hospital: e.target.value })}
                            style={{ height: 42, padding: '0 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
                            placeholder="Search or enter hospital name" />
                        <datalist id="hospitals">
                            {(cityHospitalsMap[form.city] || []).map(h => <option key={h} value={h} />)}
                        </datalist>
                    </div>

                    {/* Contact & Urgency */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact Number *</label>
                            <input type="tel" required value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })}
                                style={{ height: 42, padding: '0 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
                                placeholder="+91 98xxx xxxxx" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Urgency Level</label>
                            <select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })}
                                style={{ height: 42, padding: '0 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}>
                                <option value="normal">Normal</option>
                                <option value="urgent">🟡 Urgent</option>
                                <option value="critical">🔴 Critical</option>
                            </select>
                        </div>
                    </div>

                    {/* Reason */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reason (optional)</label>
                        <input type="text" value={form.reason || ''} onChange={e => setForm({ ...form, reason: e.target.value })}
                            style={{ height: 42, padding: '0 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
                            placeholder="Surgery, accident, etc." />
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button type="button" onClick={onClose}
                            style={{ flex: 1, height: 46, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting}
                            style={{ flex: 2, height: 46, borderRadius: 12, background: 'linear-gradient(135deg, #E63946, #FF5A5F)', color: '#fff', border: 'none', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.875rem', opacity: submitting ? 0.7 : 1, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {submitting ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Sending...</> : 'Send Req'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

function SearchDonors() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [filters, setFilters] = useState(() => {
        const params = new URLSearchParams(location.search);
        return { bloodGroup: '', city: params.get('city') || '' };
    });
    
    const [donors, setDonors] = useState([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState('nearest');

    // Auto search on mount if city is provided via URL
    useEffect(() => {
        if (filters.city) {
            handleSearch(new Event('submit'));
        }
    }, []);

    // Guest flow
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [selectedDonorId, setSelectedDonorId] = useState(null);

    // Request modal
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestForm, setRequestForm] = useState({
        patientName: '', bloodGroup: '', city: '', hospital: '',
        contactNumber: '', unitsNeeded: 1, urgency: 'normal', reason: ''
    });
    const [requestMessage, setRequestMessage] = useState({ type: '', text: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSearched(true);
        try {
            const params = new URLSearchParams();
            if (filters.bloodGroup) params.append('bloodGroup', filters.bloodGroup);
            if (filters.city) params.append('city', filters.city);
            const res = await axios.get(`/api/donors/search?${params.toString()}`);
            const results = res.data.map(d => 
                (user && (d._id === user._id || d.id === user.id || d._id === user.id)) ? { ...d, isCurrentUser: true } : d
            );
            setDonors(results);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setRequestMessage({ type: '', text: '' });
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.post('/api/requests', {
                ...requestForm,
                donorId: selectedDonorId
            }, config);
            const { matchingDonors, notifiedDonors } = res.data;
            let successText = '✅ Request sent! ';
            if (matchingDonors > 0) {
                successText += `${matchingDonors} donor(s) found, ${notifiedDonors || matchingDonors} notified.`;
            } else {
                successText += 'No exact match yet – we will alert all nearby donors.';
            }
            setRequestMessage({ type: 'success', text: successText });
            setRequestForm({ patientName: '', bloodGroup: '', city: '', hospital: '', contactNumber: '', unitsNeeded: 1, urgency: 'normal', reason: '' });
            const requestId = res.data.id || res.data._id;
            setTimeout(() => {
                setShowRequestModal(false);
                if (requestId) {
                    navigate(`/track/${requestId}`);
                }
            }, 2000);
        } catch (err) {
            setRequestMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit request' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDonorRequest = (donor) => {
        if (!user) {
            setPendingAction(donor);
            setIsAuthModalOpen(true);
            return;
        }
        setSelectedDonorId(donor.id || donor._id);
        setRequestForm(prev => ({ ...prev, bloodGroup: donor.bloodGroup || '', city: donor.city || '' }));
        setShowRequestModal(true);
    };

    const handleBroadcastRequest = () => {
        if (!user) {
            setPendingAction('general');
            setIsAuthModalOpen(true);
            return;
        }
        setSelectedDonorId(null);
        setRequestForm(prev => ({ 
            ...prev, 
            bloodGroup: filters.bloodGroup || '', 
            city: filters.city || '',
            urgency: 'urgent' // Automatically set to urgent for broadcast
        }));
        setShowRequestModal(true);
    };

    const handleAuthSuccess = () => {
        if (pendingAction === 'general') {
            setSelectedDonorId(null);
            setShowRequestModal(true);
        } else if (pendingAction && typeof pendingAction === 'object') {
            setSelectedDonorId(pendingAction.id || pendingAction._id);
            setRequestForm(prev => ({ ...prev, bloodGroup: pendingAction.bloodGroup || '', city: pendingAction.city || '' }));
            setShowRequestModal(true);
        }
        setPendingAction(null);
    };

    const sortedDonors = [...donors].sort((a, b) => {
        if (sortBy === 'points') return (b.points || 0) - (a.points || 0);
        if (sortBy === 'response') return (b.responseRate || 90) - (a.responseRate || 90);
        if (sortBy === 'rating') return (b.rating || 4.5) - (a.rating || 4.5);
        return 0; // nearest: use default order
    });

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)', paddingBottom: '3rem' }}>
            {/* Hero Header */}
            <div style={{ background: 'linear-gradient(180deg, rgba(230,57,70,0.06) 0%, transparent 100%)', borderBottom: '1px solid var(--border-color)', padding: '3rem 2rem 2.5rem' }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                        <Radio style={{ width: 14, height: 14, color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Live Network</span>
                    </div>
                    <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', lineHeight: 1.15, marginBottom: '0.625rem' }}>
                        Find Blood Donors
                        <span style={{ display: 'block', color: 'var(--primary)' }}>Near You, Instantly.</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: 500 }}>
                        Connect with Nearby Blood Donors. No login required to browse.
                    </p>
                </div>
            </div>

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem 0' }}>
                {/* Search Form Card */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.75rem', marginBottom: '2rem', boxShadow: 'var(--shadow-md)' }}>

                    <form onSubmit={handleSearch}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.875rem', alignItems: 'flex-end' }}>
                            {/* Blood Group */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Blood Group
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Droplets style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--primary)', pointerEvents: 'none' }} />
                                    <select
                                        value={filters.bloodGroup}
                                        onChange={e => setFilters({ ...filters, bloodGroup: e.target.value })}
                                        style={{ width: '100%', height: 44, paddingLeft: 36, paddingRight: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                                    >
                                        <option value="">All Blood Groups</option>
                                        {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* City */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    City
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                    <select
                                        value={filters.city}
                                        onChange={e => setFilters({ ...filters, city: e.target.value })}
                                        style={{ width: '100%', height: 44, paddingLeft: 36, paddingRight: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                                    >
                                        <option value="">All Cities</option>
                                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Search Button */}
                            <button type="submit" disabled={loading}
                                style={{ height: 44, paddingInline: '1.5rem', background: 'linear-gradient(135deg, #E63946, #FF5A5F)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', fontFamily: 'var(--font-heading)' }}>
                                {loading ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> : <Search style={{ width: 15, height: 15 }} />}
                                Search
                            </button>

                            {/* Emergency Request */}
                            <button type="button" onClick={handleBroadcastRequest}
                                style={{ height: 44, paddingInline: '1.25rem', background: 'rgba(230,57,70,0.1)', color: 'var(--primary)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', fontFamily: 'var(--font-heading)' }}>
                                <AlertTriangle style={{ width: 15, height: 15 }} />
                                Emergency
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* Results */}
                {loading && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
                            <Loader2 style={{ width: 16, height: 16, color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Searching donors...</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
                        </div>
                    </div>
                )}

                {!loading && searched && (
                    <div>
                        {/* Results Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Users style={{ width: 17, height: 17, color: 'var(--primary)' }} />
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                                    {donors.length} Available Donor{donors.length !== 1 ? 's' : ''}
                                </span>
                                {filters.bloodGroup && <span style={{ background: 'rgba(230,57,70,0.1)', color: 'var(--primary)', padding: '2px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>{filters.bloodGroup}</span>}
                                {filters.city && <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '2px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, border: '1px solid var(--border-color)' }}>{filters.city}</span>}
                            </div>

                            {/* Sort */}
                            <div style={{ display: 'flex', gap: 6 }}>
                                {[
                                    { key: 'nearest', label: 'Nearest' },
                                    { key: 'points', label: 'Most Active' },
                                    { key: 'response', label: 'Fast Response' },
                                    { key: 'rating', label: 'Top Rated' }
                                ].map(s => (
                                    <button key={s.key} onClick={() => setSortBy(s.key)}
                                        style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all 0.2s', background: sortBy === s.key ? 'var(--primary)' : 'var(--bg-secondary)', color: sortBy === s.key ? '#fff' : 'var(--text-secondary)', borderColor: sortBy === s.key ? 'var(--primary)' : 'var(--border-color)' }}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Emergency Broadcast Banner */}
                        {donors.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                style={{ background: 'linear-gradient(135deg, rgba(230,57,70,0.08), rgba(255,90,95,0.04))', border: '1px solid rgba(230,57,70,0.18)', borderRadius: 'var(--radius-md)', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.875rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(230,57,70,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Activity style={{ width: 20, height: 20, color: 'var(--primary)' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Need blood urgently?</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>Broadcast to ALL local donors instantly</div>
                                    </div>
                                </div>
                                <button onClick={handleBroadcastRequest}
                                    style={{ height: 38, paddingInline: '1.25rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer', fontFamily: 'var(--font-heading)' }}>
                                    🆘 Broadcast Request
                                </button>
                            </motion.div>
                        )}

                        {/* Donor Grid */}
                        {donors.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(265px, 1fr))', gap: '1rem' }}>
                                {sortedDonors.map((donor, i) => (
                                    <DonorCard key={donor._id} donor={donor} index={i} onRequest={handleDonorRequest} />
                                ))}
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>No donors found</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>No donors match your search. Try different filters or broadcast an emergency request.</p>
                                <button onClick={handleBroadcastRequest}
                                    style={{ height: 44, paddingInline: '1.5rem', background: 'linear-gradient(135deg, #E63946, #FF5A5F)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-heading)' }}>
                                    🆘 Broadcast Emergency Request
                                </button>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Pre-search CTA */}
                {!searched && !loading && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(230,57,70,0.1)', border: '2px solid rgba(230,57,70,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                            <Search style={{ width: 30, height: 30, color: 'var(--primary)' }} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>Search for donors</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: 400, margin: '0 auto 1.5rem' }}>
                            Select your blood group and city above to find matching donors in your area.
                        </p>
                        <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '0.82rem' }}><ShieldCheck style={{ width: 14, height: 14, color: '#0D9488' }} /> Verified donors only</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '0.82rem' }}><MapPin style={{ width: 14, height: 14, color: 'var(--primary)' }} /> Near You</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '0.82rem' }}><Heart style={{ width: 14, height: 14, color: '#E63946' }} /> Growing donor network</span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Request Modal */}
            <AnimatePresence>
                {showRequestModal && (
                    <RequestModal
                        isOpen={showRequestModal}
                        onClose={() => setShowRequestModal(false)}
                        onSubmit={handleRequestSubmit}
                        form={requestForm}
                        setForm={setRequestForm}
                        submitting={submitting}
                        message={requestMessage}
                    />
                )}
            </AnimatePresence>

            {/* Auth Modal */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onSuccess={handleAuthSuccess}
            />
        </div>
    );
}

export default SearchDonors;
