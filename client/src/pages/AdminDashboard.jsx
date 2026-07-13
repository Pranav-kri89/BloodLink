import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

// Trigger reload

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#0ea5e9', '#3b82f6', '#8b5cf6'];

function AdminDashboard() {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [donors, setDonors] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    const getConfig = () => ({ headers: { Authorization: `Bearer ${token}` } });

    const [donorToDelete, setDonorToDelete] = useState(null);

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, donorsRes, requestsRes] = await Promise.all([
                axios.get('/api/admin/stats', getConfig()),
                axios.get('/api/admin/donors', getConfig()),
                axios.get('/api/admin/requests', getConfig())
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

    const confirmDeleteDonor = async () => {
        if (!donorToDelete) return;
        try {
            await axios.delete(`/api/admin/donors/${donorToDelete}`, getConfig());
            setDonors(donors.filter(d => d._id !== donorToDelete));
            setMessage({ type: 'success', text: 'Donor removed successfully' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to remove donor' });
        } finally {
            setDonorToDelete(null);
        }
    };

    const handleUpdateRequestStatus = async (id, status) => {
        try {
            await axios.put(`/api/admin/requests/${id}`, { status }, getConfig());
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
        <>
            {donorToDelete && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', maxWidth: '400px', width: '90%' }}>
                        <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Confirm Deletion</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Are you sure you want to remove this donor? This action cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setDonorToDelete(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={confirmDeleteDonor}>Yes, Remove Donor</button>
                        </div>
                    </div>
                </div>
            )}
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
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.donorsByBloodGroup.map(item => ({ name: item._id || 'Unknown', value: item.count }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {stats.donorsByBloodGroup.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
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
            {activeTab === 'overview' && (
                <div className="card">
                    <h2>Recent Activity</h2>
                    <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Last 5 blood requests</p>

                    {stats && stats.recentRequests && stats.recentRequests.length > 0 ? (
                        <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table style={{ position: 'relative' }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--bg-card)' }}>
                                    <tr>
                                        <th>Date</th>
                                        <th>Patient</th>
                                        <th>Blood Group</th>
                                        <th>City</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentRequests.map(req => (
                                        <tr key={req._id}>
                                            <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                                            <td style={{ fontWeight: 500 }}>{req.patientName}</td>
                                            <td><span className="blood-group-badge">{req.bloodGroup}</span></td>
                                            <td>{req.city}</td>
                                            <td><span className={`status-badge ${req.status}`}>{req.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No recent activity found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Donors Tab */}
            {activeTab === 'donors' && (
                <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={{ position: 'relative' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--bg-card)' }}>
                            <tr>
                                <th>Name</th>
                                <th>Blood Group</th>
                                <th>City</th>
                                <th>Contact</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {donors.map(donor => (
                                <tr key={donor._id}>
                                    <td style={{ fontWeight: 500 }}>{donor.name}</td>
                                    <td><span className="blood-group-badge">{donor.bloodGroup || '—'}</span></td>
                                    <td>{donor.city || '—'}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.875rem' }}>
                                            <span>{donor.phone}</span>
                                            <span style={{ color: 'var(--text-light)' }}>{donor.email}</span>
                                        </div>
                                    </td>
                                    <td>{new Date(donor.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => setDonorToDelete(donor._id)}
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
                <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={{ position: 'relative' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--bg-card)' }}>
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
        </>
    );
}

export default AdminDashboard;
