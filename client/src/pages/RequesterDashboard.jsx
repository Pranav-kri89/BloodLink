import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function RequesterDashboard() {
    const { user, token } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        fulfilled: 0,
        urgent: 0
    });

    useEffect(() => {
        fetchData();
    }, [token]);

    const fetchData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('/api/requests/my', config);
            const data = res.data;
            setRequests(data);

            // Calculate stats
            const newStats = {
                total: data.length,
                pending: data.filter(r => r.status === 'pending').length,
                fulfilled: data.filter(r => r.status === 'fulfilled').length,
                urgent: data.filter(r => r.urgency === 'urgent' || r.urgency === 'critical').length
            };
            setStats(newStats);
        } catch (err) {
            console.error('Failed to fetch requests', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        if (!window.confirm(`Mark this request as ${newStatus}?`)) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`/api/requests/${id}/status`, { status: newStatus }, config);
            fetchData(); // Refresh data
            alert(`Request marked as ${newStatus}!`);
        } catch (err) {
            console.error('Failed to update status', err);
            alert(`Failed to update status: ${err.response?.data?.message || err.message}`);
        }
    };

    // Quick fix: The current backend might not allow requesters to update status via the admin route.
    // I should check/update the backend route to allow owners to update their requests. 
    // But let's build the UI first.

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className="page-container fade-in">
            {/* Profile / Welcome Card */}
            <div className="profile-card" style={{ marginBottom: '2rem' }}>
                <div className="profile-avatar">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                    <h2>Welcome, {user?.name}!</h2>
                    <p>Manage your blood requests and track their status.</p>
                    <div className="profile-meta">
                        <div className="profile-meta-item">
                            <span>📧</span> {user?.email}
                        </div>
                        <div className="profile-meta-item">
                            <span>📱</span> {user?.phone || 'No phone'}
                        </div>
                        <div className="profile-meta-item">
                            <span>📍</span> {user?.city || 'No city'}
                        </div>
                    </div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <Link to="/search" className="btn btn-primary">
                        ➕ New Request
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card blue">
                    <div className="stat-icon">📋</div>
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total Requests</div>
                </div>
                <div className="stat-card yellow">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-value">{stats.pending}</div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon">✅</div>
                    <div className="stat-value">{stats.fulfilled}</div>
                    <div className="stat-label">Fulfilled</div>
                </div>
                <div className="stat-card red">
                    <div className="stat-icon">🆘</div>
                    <div className="stat-value">{stats.urgent}</div>
                    <div className="stat-label">Urgent/Critical</div>
                </div>
            </div>

            {/* Requests List */}
            <div className="card">
                <div className="section-header">
                    <h2>Your Requests</h2>
                </div>

                {requests.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📝</div>
                        <p>You haven't made any blood requests yet.</p>
                        <Link to="/search" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                            Create Request
                        </Link>
                    </div>
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
                                {requests.map(req => (
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
        </div>
    );
}

export default RequesterDashboard;
