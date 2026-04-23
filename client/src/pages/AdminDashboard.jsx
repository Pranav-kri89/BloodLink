import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function AdminDashboard() {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [donors, setDonors] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, donorsRes, requestsRes] = await Promise.all([
                axios.get('/api/admin/stats', config),
                axios.get('/api/admin/donors', config),
                axios.get('/api/admin/requests', config)
            ]);
            setStats(statsRes.data);
            setDonors(donorsRes.data);
            setRequests(requestsRes.data);
        } catch (err) {
            console.error('Failed to fetch admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDonor = async (id) => {
        if (!window.confirm('Are you sure you want to remove this donor?')) return;

        try {
            await axios.delete(`/api/admin/donors/${id}`, config);
            setDonors(donors.filter(d => d._id !== id));
            setMessage({ type: 'success', text: 'Donor removed successfully' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to remove donor' });
        }
    };

    const handleUpdateRequestStatus = async (id, status) => {
        try {
            await axios.put(`/api/admin/requests/${id}`, { status }, config);
            setRequests(requests.map(r => r._id === id ? { ...r, status } : r));
            setMessage({ type: 'success', text: `Request marked as ${status}` });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update request' });
        }
    };

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1>Admin Dashboard</h1>
                <p>Manage donors, requests, and view system statistics</p>
            </div>

            {message.text && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                    {message.text}
                </div>
            )}

            {/* Stat Cards */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card red">
                        <div className="stat-icon">🩸</div>
                        <div className="stat-value">{stats.totalDonors}</div>
                        <div className="stat-label">Total Donors</div>
                    </div>
                    <div className="stat-card green">
                        <div className="stat-icon">✅</div>
                        <div className="stat-value">{stats.availableDonors}</div>
                        <div className="stat-label">Available Donors</div>
                    </div>
                    <div className="stat-card blue">
                        <div className="stat-icon">📋</div>
                        <div className="stat-value">{stats.totalRequests}</div>
                        <div className="stat-label">Total Requests</div>
                    </div>
                    <div className="stat-card yellow">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-value">{stats.pendingRequests}</div>
                        <div className="stat-label">Pending Requests</div>
                    </div>
                    <div className="stat-card purple">
                        <div className="stat-icon">🎉</div>
                        <div className="stat-value">{stats.fulfilledRequests}</div>
                        <div className="stat-label">Fulfilled</div>
                    </div>
                </div>
            )}

            {/* Blood Group Distribution */}
            {stats && stats.donorsByBloodGroup && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Donors by Blood Group</h3>
                    <div className="blood-group-chart">
                        {stats.donorsByBloodGroup.map(item => (
                            <div key={item._id} className="blood-group-item">
                                <div className="bg-label">{item._id || 'Not Set'}</div>
                                <div className="bg-count">{item.count} donor{item.count !== 1 ? 's' : ''}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`tab-btn ${activeTab === 'donors' ? 'active' : ''}`}
                    onClick={() => setActiveTab('donors')}
                >
                    Donors ({donors.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    Requests ({requests.length})
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
                <div className="card">
                    <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Recent Requests</h3>
                    {stats.recentRequests?.length > 0 ? (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Blood Group</th>
                                        <th>City</th>
                                        <th>Urgency</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentRequests.map(req => (
                                        <tr key={req._id}>
                                            <td>{req.patientName}</td>
                                            <td><span className="blood-group-badge">{req.bloodGroup}</span></td>
                                            <td>{req.city}</td>
                                            <td><span className={`status-badge ${req.urgency}`}>{req.urgency}</span></td>
                                            <td><span className={`status-badge ${req.status}`}>{req.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No requests yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Donors Tab */}
            {activeTab === 'donors' && (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Blood Group</th>
                                <th>City</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {donors.map(donor => (
                                <tr key={donor._id}>
                                    <td style={{ fontWeight: 500 }}>{donor.name}</td>
                                    <td>{donor.email}</td>
                                    <td>{donor.phone}</td>
                                    <td><span className="blood-group-badge">{donor.bloodGroup || '—'}</span></td>
                                    <td>{donor.city || '—'}</td>
                                    <td>
                                        <span className={`availability-badge ${donor.available ? 'available' : 'unavailable'}`}>
                                            <span className="dot"></span>
                                            {donor.available ? 'Available' : 'Unavailable'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDeleteDonor(donor._id)}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Blood Group</th>
                                <th>Hospital</th>
                                <th>City</th>
                                <th>Units</th>
                                <th>Urgency</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req._id}>
                                    <td style={{ fontWeight: 500 }}>{req.patientName}</td>
                                    <td><span className="blood-group-badge">{req.bloodGroup}</span></td>
                                    <td>{req.hospital}</td>
                                    <td>{req.city}</td>
                                    <td>{req.unitsNeeded}</td>
                                    <td><span className={`status-badge ${req.urgency}`}>{req.urgency}</span></td>
                                    <td><span className={`status-badge ${req.status}`}>{req.status}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {req.status === 'pending' && (
                                                <>
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => handleUpdateRequestStatus(req._id, 'fulfilled')}
                                                    >
                                                        Fulfill
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => handleUpdateRequestStatus(req._id, 'cancelled')}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
