import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function DonorDashboard() {
    const { user, token, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        bloodGroup: '',
        city: '',
        lastDonationDate: ''
    });
    const [available, setAvailable] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [saving, setSaving] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifs, setLoadingNotifs] = useState(false);
    const [myDonations, setMyDonations] = useState([]);
    const [loadingDonations, setLoadingDonations] = useState(false);
    const [myRequests, setMyRequests] = useState([]);
    const [loadingMyRequests, setLoadingMyRequests] = useState(false);

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const cities = ['Bantwal', 'Belthangady', 'Dharmasthala', 'Kadaba', 'Kanhangad', 'Kasaragod', 'Kundapura', 'Mangaluru', 'Manjeshwar', 'Manipal', 'Moodbidri', 'Mulki', 'Puttur', 'Sullia', 'Surathkal', 'Udupi', 'Uppala', 'Vitla'];

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                bloodGroup: user.bloodGroup || '',
                city: user.city || '',
                lastDonationDate: user.lastDonationDate
                    ? new Date(user.lastDonationDate).toISOString().split('T')[0]
                    : ''
            });
            setAvailable(user.available !== undefined ? user.available : true);
        }
    }, [user]);

    // Fetch notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!token) return;
            setLoadingNotifs(true);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get('/api/notifications', config);
                setNotifications(res.data);
            } catch (err) {
                console.error('Failed to load notifications');
            } finally {
                setLoadingNotifs(false);
            }
        };
        const fetchMyDonations = async () => {
            if (!token) return;
            setLoadingDonations(true);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get('/api/requests/donor/my', config);
                setMyDonations(res.data);
            } catch (err) {
                console.error('Failed to load donations');
            } finally {
                setLoadingDonations(false);
            }
        };

        const fetchMyRequests = async () => {
            if (!token) return;
            setLoadingMyRequests(true);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get('/api/requests/my', config);
                setMyRequests(res.data);
            } catch (err) {
                console.error('Failed to load my requests');
            } finally {
                setLoadingMyRequests(false);
            }
        };

        fetchNotifications();
        fetchMyDonations();
        fetchMyRequests();
        const interval = setInterval(() => {
            fetchNotifications();
            fetchMyDonations();
            fetchMyRequests();
        }, 30000);
        return () => clearInterval(interval);
    }, [token]);

    const config = { headers: { Authorization: `Bearer ${token}` } };

    const handleAcceptRequest = async (requestId) => {
        if (!window.confirm("Are you sure you want to accept this request?")) return;
        try {
            await axios.put(`/api/requests/${requestId}/accept`, {}, config);
            alert("Request accepted! The requester has been notified.");
            // Refresh donations list
            const res = await axios.get('/api/requests/donor/my', config);
            setMyDonations(res.data);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to accept request');
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        if (!window.confirm(`Mark this request as ${newStatus}?`)) return;

        try {
            await axios.put(`/api/requests/${id}/status`, { status: newStatus }, config);
            const res = await axios.get('/api/requests/my', config);
            setMyRequests(res.data);
            alert(`Request marked as ${newStatus}!`);
        } catch (err) {
            console.error('Failed to update status', err);
            alert(`Failed to update status: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await axios.put('/api/donors/profile', formData, config);
            updateUser(res.data);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.put(`/api/notifications/${id}/read`, {}, config);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (err) {
            console.error('Failed to mark notification as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put('/api/notifications/read-all', {}, config);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Failed to mark all as read');
        }
    };

    // Calculate 60-day cooldown
    const COOLDOWN_DAYS = 60;
    let daysSinceDonation = null;
    let daysRemaining = 0;
    let isEligible = true;

    if (user && user.lastDonationDate) {
        daysSinceDonation = Math.floor((Date.now() - new Date(user.lastDonationDate)) / (1000 * 60 * 60 * 24));
        if (daysSinceDonation < COOLDOWN_DAYS) {
            daysRemaining = COOLDOWN_DAYS - daysSinceDonation;
            isEligible = false;
        }
    }

    const toggleAvailability = async () => {
        if (!isEligible) {
            setMessage({ type: 'error', text: `You cannot donate yet. Please wait ${daysRemaining} more day(s). (60-day cooldown)` });
            return;
        }
        try {
            const res = await axios.put('/api/donors/availability', {}, config);
            setAvailable(res.data.available);
            updateUser({ available: res.data.available });
            setMessage({
                type: 'success',
                text: res.data.available ? 'You are now available for donation!' : 'You are now marked as unavailable.'
            });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update availability' });
        }
    };

    if (!user) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1>Donor Dashboard</h1>
                <p>Manage your profile and availability status</p>
            </div>

            {/* Profile Card */}
            <div className="profile-card">
                <div className="profile-avatar">
                    {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                    <h2>{user.name}</h2>
                    <p>{user.email}</p>
                    <div className="profile-meta">
                        {user.bloodGroup && (
                            <span className="blood-group-badge">{user.bloodGroup}</span>
                        )}
                        <span className={`availability-badge ${available ? 'available' : 'unavailable'}`}>
                            <span className="dot"></span>
                            {available ? 'Available' : 'Unavailable'}
                        </span>
                        <span className="blood-group-badge" style={{ background: 'rgba(255, 215, 0, 0.15)', color: '#d4af37', border: '1px solid rgba(255, 215, 0, 0.4)' }}>
                            ⭐ {user.points || 0} Points
                        </span>
                    </div>
                </div>
            </div>

            <div className="dashboard-content" style={{ marginTop: '1.5rem' }}>
                {/* Notifications Panel */}
                <div className="card" style={{ borderLeft: notifications.filter(n => !n.read).length > 0 ? '4px solid #dc3545' : '4px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontWeight: 600, margin: 0 }}>
                            Notifications
                            {notifications.filter(n => !n.read).length > 0 && (
                                <span style={{ background: '#dc3545', color: 'white', borderRadius: '12px', padding: '2px 10px', fontSize: '0.75rem', marginLeft: '8px', fontWeight: 700 }}>
                                    {notifications.filter(n => !n.read).length} new
                                </span>
                            )}
                        </h3>
                        {notifications.filter(n => !n.read).length > 0 && (
                            <button onClick={markAllAsRead} style={{ fontSize: '0.8rem', padding: '4px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', cursor: 'pointer' }}>
                                Mark all read
                            </button>
                        )}
                    </div>

                    {loadingNotifs ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading...</p>
                    ) : notifications.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                            No notifications yet. When someone requests your blood type, you will see it here!
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '400px', overflowY: 'auto' }}>
                            {notifications.map(notif => {
                                const isReward = notif.type === 'request_fulfilled';
                                return (
                                    <div key={notif._id} style={{
                                        background: isReward
                                            ? (notif.read ? '#fff9e6' : '#fff3cd')
                                            : (notif.read ? 'var(--bg-secondary)' : 'rgba(220, 53, 69, 0.08)'),
                                        border: isReward
                                            ? '1px solid #ffeeba'
                                            : (notif.read ? '1px solid var(--border-color)' : '1px solid rgba(220, 53, 69, 0.3)'),
                                        borderRadius: '10px',
                                        padding: '14px',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                {isReward ? (
                                                    <span style={{ background: '#FFC107', color: '#212529', padding: '2px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                                        ⭐ Reward
                                                    </span>
                                                ) : (
                                                    <span style={{ background: notif.urgency === 'critical' ? '#F44336' : notif.urgency === 'urgent' ? '#FF9800' : '#4CAF50', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                                        {notif.urgency}
                                                    </span>
                                                )}
                                                <span className="blood-group-badge" style={{ fontSize: '0.8rem' }}>{notif.bloodGroup}</span>
                                                {!notif.read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isReward ? '#FFC107' : '#dc3545', display: 'inline-block' }}></span>}
                                            </div>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                {new Date(notif.createdAt).toLocaleString()}
                                            </span>
                                        </div>

                                        <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 600 }}>{notif.title}</h4>
                                        <p style={{ margin: '0 0 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{notif.message}</p>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.8rem', background: isReward ? 'rgba(255, 255, 255, 0.5)' : 'var(--bg-secondary)', borderRadius: '8px', padding: '10px' }}>
                                            <div><span style={{ color: 'var(--text-muted)' }}>Hospital:</span> <strong>{notif.hospital}</strong></div>
                                            <div><span style={{ color: 'var(--text-muted)' }}>City:</span> <strong>{notif.city}</strong></div>
                                            <div><span style={{ color: 'var(--text-muted)' }}>Patient:</span> <strong>{notif.patientName}</strong></div>
                                            <div><span style={{ color: 'var(--text-muted)' }}>Units:</span> <strong>{notif.unitsNeeded}</strong></div>
                                            {notif.contactNumber && <div><span style={{ color: 'var(--text-muted)' }}>Contact:</span> <strong>{notif.contactNumber}</strong></div>}
                                            <div><span style={{ color: 'var(--text-muted)' }}>Requester:</span> <strong>{notif.requesterName}</strong></div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                            {notif.type === 'blood_request' && (
                                                <button onClick={() => handleAcceptRequest(notif.bloodRequest)} style={{ fontSize: '0.8rem', padding: '4px 14px', background: 'var(--primary)', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                                                    ✓ Accept Request
                                                </button>
                                            )}
                                            {!notif.read && (
                                                <button onClick={() => markAsRead(notif._id)} style={{ fontSize: '0.8rem', padding: '4px 14px', background: 'transparent', border: '1px solid var(--accent-green)', color: 'var(--accent-green)', borderRadius: '6px', cursor: 'pointer' }}>
                                                    Mark as read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* My Donations Panel */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>My Donations</h3>
                    {loadingDonations ? (
                        <p style={{ color: 'var(--text-muted)' }}>Loading donations...</p>
                    ) : myDonations.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>You haven't accepted any requests yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {myDonations.map(donation => (
                                <div key={donation._id} style={{
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    background: donation.status === 'fulfilled' ? '#f0fdf4' : 'var(--bg-secondary)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <h4 style={{ margin: 0 }}>Patient: {donation.patientName}</h4>
                                        <span className={`status-badge ${donation.status}`}>
                                            {donation.status === 'fulfilled' ? 'Donated Successfully' : donation.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        <p style={{ margin: '4px 0' }}>Hospital: {donation.hospital}, {donation.city}</p>
                                        <p style={{ margin: '4px 0' }}>Requester: {donation.requester?.name} ({donation.requester?.phone})</p>
                                        <p style={{ margin: '4px 0' }}>Date: {new Date(donation.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* My Blood Requests (As a Requester) */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>My Blood Requests</h3>
                    {loadingMyRequests ? (
                        <p style={{ color: 'var(--text-muted)' }}>Loading your requests...</p>
                    ) : myRequests.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>You haven't requested any blood. If you need blood, go to the Search Donors page to create a request.</p>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Blood Group</th>
                                        <th>Hospital</th>
                                        <th>City</th>
                                        <th>Urgency</th>
                                        <th>Donor</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myRequests.map(req => (
                                        <tr key={req._id}>
                                            <td style={{ fontWeight: 600 }}>{req.patientName}</td>
                                            <td><span className="blood-group-badge">{req.bloodGroup}</span></td>
                                            <td>{req.hospital}</td>
                                            <td>{req.city}</td>
                                            <td>
                                                <span className={`status-badge ${req.urgency}`}>
                                                    {req.urgency}
                                                </span>
                                            </td>
                                            <td>
                                                {req.donor ? (
                                                    <div style={{ fontSize: '0.85rem' }}>
                                                        <strong>{req.donor.name}</strong>
                                                        <div style={{ color: 'var(--text-muted)' }}>{req.donor.phone}</div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${req.status}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                {(req.status === 'pending' || req.status === 'accepted') && (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        {req.status === 'accepted' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    handleStatusUpdate(req._id, 'fulfilled');
                                                                }}
                                                                className="btn btn-sm btn-success"
                                                                title="Mark as Fulfilled"
                                                            >
                                                                ✓ Fulfilled
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleStatusUpdate(req._id, 'cancelled');
                                                            }}
                                                            className="btn btn-sm btn-danger"
                                                            title="Cancel Request"
                                                        >
                                                            ✕ Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Availability Toggle */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Availability Status</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
                        Toggle your availability to let patients know if you can donate blood right now.
                    </p>

                    {!isEligible && (
                        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                            ⏳ You donated {daysSinceDonation} day(s) ago. You need to wait <strong>{daysRemaining} more day(s)</strong> before donating again. (60-day cooldown)
                        </div>
                    )}

                    {isEligible && daysSinceDonation !== null && (
                        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                            ✅ You are eligible to donate! Last donation was {daysSinceDonation} days ago.
                        </div>
                    )}

                    <div className="toggle-container">
                        <label className="toggle-switch">
                            <input type="checkbox" checked={available} onChange={toggleAvailability} disabled={!isEligible && !available} />
                            <span className="toggle-slider" style={!isEligible && !available ? { opacity: 0.5, cursor: 'not-allowed' } : {}}></span>
                        </label>
                        <span style={{ fontWeight: 500, color: available ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                            {available ? 'Available for Donation' : !isEligible ? `Cooldown (${daysRemaining} days left)` : 'Not Available'}
                        </span>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Quick Info</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Blood Group</span>
                            <span className="blood-group-badge">{user.bloodGroup || 'Not set'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>City</span>
                            <span style={{ fontWeight: 500 }}>{user.city || 'Not set'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Last Donation</span>
                            <span style={{ fontWeight: 500 }}>
                                {user.lastDonationDate
                                    ? new Date(user.lastDonationDate).toLocaleDateString()
                                    : 'Never'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Rewards Points</span>
                            <span style={{ fontWeight: 700, color: '#d4af37' }}>{user.points || 0} ⭐</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Donor Level</span>
                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                {(user.points || 0) < 100 ? 'Bronze 🥉' : (user.points || 0) < 500 ? 'Silver 🥈' : 'Gold 🥇'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Edit Profile Form */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <h3 style={{ marginBottom: '1.2rem', fontWeight: 600 }}>Edit Profile</h3>

                    {message.text && (
                        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSave}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-control"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-control"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
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
                                    <option value="">Select Blood Group</option>
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

                        <div className="form-group">
                            <label>Last Donation Date</label>
                            <input
                                type="date"
                                name="lastDonationDate"
                                className="form-control"
                                value={formData.lastDonationDate}
                                onChange={handleChange}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default DonorDashboard;
