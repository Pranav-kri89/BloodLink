import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { Bell, Trash2, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown, Award } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const PAGE_SIZE = 10;

function RequesterDashboard() {
    const { user, token } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0, pending: 0, accepted: 0, fulfilled: 0, cancelled: 0, urgent: 0
    });

    // Filter / Sort / Pagination state
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState('desc');
    const [page, setPage] = useState(1);
    const [expandedRow, setExpandedRow] = useState(null);

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [expandedNotifId, setExpandedNotifId] = useState(null);

    useEffect(() => {
        fetchData();
        fetchNotifications();

        if (!token || !user) return;
        const socket = io(SOCKET_URL);
        socket.emit('authenticate', token);
        
        socket.on('new_notification', (notif) => {
            setNotifications(prev => [notif, ...prev]);
            alert(`New Notification: ${notif.title}`);
        });
        
        return () => socket.disconnect();
    }, [token, user]);

    const fetchNotifications = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('/api/notifications', config);
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to load notifications', err);
        }
    };

    const markAsRead = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`/api/notifications/${id}/read`, {}, config);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put('/api/notifications/read-all', {}, config);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const deleteNotification = async (id, e) => {
        e.stopPropagation();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`/api/notifications/${id}`, config);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            console.error('Failed to delete notification', err);
        }
    };

    const deleteAllNotifications = async () => {
        if (!window.confirm("Are you sure you want to delete all notifications?")) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete('/api/notifications/all', config);
            setNotifications([]);
        } catch (err) {
            console.error('Failed to delete all notifications', err);
        }
    };

    const fetchData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('/api/requests/my', config);
            const data = res.data;
            setRequests(data);
            setStats({
                total: data.length,
                pending: data.filter(r => r.status === 'pending').length,
                accepted: data.filter(r => r.status === 'accepted').length,
                fulfilled: data.filter(r => r.status === 'fulfilled').length,
                cancelled: data.filter(r => r.status === 'cancelled').length,
                urgent: data.filter(r => r.urgency === 'urgent' || r.urgency === 'critical').length
            });
        } catch (err) {
            console.error('Failed to fetch requests', err);
        } finally {
            setLoading(false);
        }
    };

    // Derived: filtered + sorted + paginated list
    const filtered = useMemo(() => {
        let list = statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter);
        list = [...list].sort((a, b) => {
            let va = a[sortField], vb = b[sortField];
            if (sortField === 'createdAt') { va = new Date(va); vb = new Date(vb); }
            if (sortField === 'urgency') {
                const ord = { critical: 3, urgent: 2, normal: 1 };
                va = ord[va] || 0; vb = ord[vb] || 0;
            }
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [requests, statusFilter, sortField, sortDir]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const toggleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
        setPage(1);
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <ArrowUpDown style={{ width: 12, height: 12, opacity: 0.4, marginLeft: 4 }} />;
        return sortDir === 'asc'
            ? <ArrowUp style={{ width: 12, height: 12, color: 'var(--primary)', marginLeft: 4 }} />
            : <ArrowDown style={{ width: 12, height: 12, color: 'var(--primary)', marginLeft: 4 }} />;
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

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className="page-container fade-in">
            <div className="dashboard-grid">
                <div className="dashboard-main">
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

            {/* Stats Grid — 6 clickable cards */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
                {[
                    { key: 'all',       label: 'Total',     icon: '📋', cls: 'blue',  val: stats.total     },
                    { key: 'pending',   label: 'Pending',   icon: '⏳', cls: 'yellow', val: stats.pending  },
                    { key: 'accepted',  label: 'Accepted',  icon: '✋', cls: '',       val: stats.accepted  },
                    { key: 'fulfilled', label: 'Fulfilled', icon: '✅', cls: 'green',  val: stats.fulfilled },
                    { key: 'cancelled', label: 'Cancelled', icon: '✕', cls: '',        val: stats.cancelled },
                    { key: 'urgent',    label: 'Urgent',    icon: '🆘', cls: 'red',    val: stats.urgent    },
                ].map(s => (
                    <div
                        key={s.key}
                        className={`stat-card ${s.cls}`}
                        style={{ cursor: 'pointer', outline: statusFilter === s.key ? '2px solid var(--primary)' : 'none' }}
                        onClick={() => { setStatusFilter(s.key === 'urgent' ? 'all' : s.key); setPage(1); }}
                    >
                        <div className="stat-icon">{s.icon}</div>
                        <div className="stat-value">{s.val}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Requests History */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                    <h2 style={{ margin: 0, fontWeight: 700 }}>Request History</h2>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                        {statusFilter !== 'all' && ` · filtered by "${statusFilter}"`}
                    </span>
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {['all', 'pending', 'accepted', 'arrived', 'fulfilled', 'cancelled'].map(s => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            style={{
                                padding: '4px 14px', borderRadius: '20px', border: '1px solid',
                                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                                background: statusFilter === s ? 'var(--primary)' : 'transparent',
                                color: statusFilter === s ? 'white' : 'var(--text-muted)',
                                borderColor: statusFilter === s ? 'var(--primary)' : 'var(--border-color)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                            {s !== 'all' && (
                                <span style={{ marginLeft: '5px', opacity: 0.7 }}>({requests.filter(r => r.status === s).length})</span>
                            )}
                        </button>
                    ))}
                </div>

                {requests.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📝</div>
                        <p>You haven't made any blood requests yet.</p>
                        <Link to="/search" className="btn btn-primary" style={{ marginTop: '1rem' }}>Create Request</Link>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No requests with status &quot;{statusFilter}&quot;.
                    </div>
                ) : (
                    <>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }} onClick={() => toggleSort('patientName')}>
                                        Patient <SortIcon field="patientName" />
                                    </th>
                                    <th>Blood</th>
                                    <th>Hospital / City</th>
                                    <th>Donor</th>
                                    <th style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }} onClick={() => toggleSort('urgency')}>
                                        Urgency <SortIcon field="urgency" />
                                    </th>
                                    <th style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }} onClick={() => toggleSort('status')}>
                                        Status <SortIcon field="status" />
                                    </th>
                                    <th style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }} onClick={() => toggleSort('createdAt')}>
                                        Date <SortIcon field="createdAt" />
                                    </th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map(req => {
                                    const reqId = req.id || req._id;
                                    const isExpanded = expandedRow === reqId;
                                    const isActive = req.status === 'pending' || req.status === 'accepted' || req.status === 'arrived';
                                    return (
                                        <React.Fragment key={reqId}>
                                        <tr style={{ background: isExpanded ? 'var(--bg-secondary)' : '' }}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{req.patientName}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{req.unitsNeeded} unit{req.unitsNeeded !== 1 ? 's' : ''}</div>
                                            </td>
                                            <td><span className="blood-group-badge">{req.bloodGroup}</span></td>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{req.hospital}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.city}</div>
                                                {(req.hospitalAddress || req.doctorName || req.reason || req.attenderName) && (
                                                    <button
                                                        onClick={() => setExpandedRow(isExpanded ? null : reqId)}
                                                        style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.72rem', cursor: 'pointer', padding: '2px 0', display: 'flex', alignItems: 'center', gap: '2px' }}
                                                    >
                                                        {isExpanded ? <ChevronUp style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />}
                                                        {isExpanded ? 'Less' : 'More info'}
                                                    </button>
                                                )}
                                            </td>
                                            <td>
                                                {req.donor ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                                            {req.donor.profilePicture
                                                                ? <img src={req.donor.profilePicture} alt={req.donor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                : <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>{req.donor.name?.charAt(0).toUpperCase()}</span>
                                                            }
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600 }}>{req.donor.name}</div>
                                                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                {req.donor.bloodGroup && (
                                                                    <span style={{ background: 'rgba(201,29,46,0.1)', color: 'var(--primary)', borderRadius: '10px', padding: '0 5px', fontSize: '0.68rem', fontWeight: 700 }}>{req.donor.bloodGroup}</span>
                                                                )}
                                                                {req.donor.city && (
                                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>📍{req.donor.city}</span>
                                                                )}
                                                            </div>
                                                            {req.donor.phone && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        const hasCalled = localStorage.getItem(`called_donor_${reqId}`);
                                                                        if (hasCalled && !window.confirm('Already called. Call again?')) return;
                                                                        localStorage.setItem(`called_donor_${reqId}`, new Date().toISOString());
                                                                        window.location.href = `tel:${req.donor.phone}`;
                                                                    }}
                                                                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.72rem', textDecoration: 'underline' }}
                                                                >
                                                                    📞 {req.donor.phone}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Awaiting...</span>
                                                )}
                                            </td>
                                            <td><span className={`status-badge ${req.urgency}`}>{req.urgency}</span></td>
                                            <td>
                                                <span className={`status-badge ${req.status}`} style={{ textTransform: 'capitalize' }}>
                                                    {req.status === 'fulfilled'  ? '✅ Fulfilled'  :
                                                     req.status === 'accepted'   ? '✋ Accepted'   :
                                                     req.status === 'arrived'    ? '🏥 Arrived'    :
                                                     req.status === 'cancelled'  ? '✕ Cancelled'  :
                                                     req.status === 'pending'    ? '⏳ Pending'    :
                                                     req.status}
                                                </span>
                                            </td>
                                            <td style={{ whiteSpace: 'nowrap' }}>
                                                <div style={{ fontSize: '0.82rem' }}>{new Date(req.createdAt).toLocaleDateString()}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    {/* Track: only for active requests */}
                                                    {isActive && (
                                                        <Link to={`/track/${reqId}`} className="btn btn-sm btn-secondary" title="Track Request">🔍 Track</Link>
                                                    )}
                                                    {/* Mark Fulfilled: only when accepted */}
                                                    {req.status === 'accepted' && (
                                                        <button onClick={() => handleStatusUpdate(reqId, 'fulfilled')} className="btn btn-sm btn-success" title="Mark as Fulfilled">✓ Fulfilled</button>
                                                    )}
                                                    {/* Cancel: only for active */}
                                                    {isActive && (
                                                        <button onClick={() => handleStatusUpdate(reqId, 'cancelled')} className="btn btn-sm btn-danger" title="Cancel">✕ Cancel</button>
                                                    )}
                                                    {/* Certificate: show for requester when fulfilled */}
                                                    {req.status === 'fulfilled' && req.donor && (
                                                        <button
                                                            onClick={() => alert(`Donation Certificate\n\nDonor: ${req.donor.name}\nPatient: ${req.patientName}\nHospital: ${req.hospital}, ${req.city}\nBlood Group: ${req.bloodGroup}\nDate: ${new Date(req.createdAt).toLocaleDateString()}\n\nStatus: Fulfilled ✅`)}
                                                            className="btn btn-sm"
                                                            style={{ background: '#F59E0B', color: '#000', border: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                                                            title="View Certificate"
                                                        >
                                                            <Award style={{ width: 12, height: 12 }} /> Certificate
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expandable hospital/patient detail row */}
                                        {isExpanded && (
                                            <tr style={{ background: 'var(--bg-secondary)' }}>
                                                <td colSpan={8} style={{ padding: '12px 16px 16px', borderTop: '1px dashed var(--border-color)' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', fontSize: '0.83rem' }}>
                                                        {req.hospitalAddress && (
                                                            <div><span style={{ color: 'var(--text-muted)' }}>🏥 Address:</span> <strong>{req.hospitalAddress}</strong></div>
                                                        )}
                                                        {req.doctorName && (
                                                            <div><span style={{ color: 'var(--text-muted)' }}>👨‍⚕️ Doctor:</span> <strong>{req.doctorName}</strong></div>
                                                        )}
                                                        {req.patientAge > 0 && (
                                                            <div><span style={{ color: 'var(--text-muted)' }}>Age:</span> <strong>{req.patientAge}</strong></div>
                                                        )}
                                                        {req.patientGender && (
                                                            <div><span style={{ color: 'var(--text-muted)' }}>Gender:</span> <strong>{req.patientGender}</strong></div>
                                                        )}
                                                        {req.attenderName && (
                                                            <div>
                                                                <span style={{ color: 'var(--text-muted)' }}>Attender:</span> <strong>{req.attenderName}</strong>
                                                                {req.attenderPhone && <a href={`tel:${req.attenderPhone}`} style={{ color: 'var(--primary)', marginLeft: 6 }}>{req.attenderPhone}</a>}
                                                            </div>
                                                        )}
                                                        {req.requiredBefore && (
                                                            <div><span style={{ color: 'var(--text-muted)' }}>Required Before:</span> <strong style={{ color: 'var(--primary)' }}>{new Date(req.requiredBefore).toLocaleString()}</strong></div>
                                                        )}
                                                        {req.reason && (
                                                            <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-muted)' }}>Reason:</span> {req.reason}</div>
                                                        )}
                                                        {req.additionalNotes && (
                                                            <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-muted)' }}>Notes:</span> {req.additionalNotes}</div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                            <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                                Page {page} of {totalPages} &nbsp;·&nbsp; {((page-1)*PAGE_SIZE)+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
                            </span>
                            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-sm btn-secondary" style={{ opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                    .reduce((acc, p, idx, arr) => {
                                        if (idx > 0 && arr[idx-1] !== p - 1) acc.push('...');
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, idx) => p === '...'
                                        ? <span key={`e${idx}`} style={{ color: 'var(--text-muted)', padding: '0 2px' }}>…</span>
                                        : <button key={p} onClick={() => setPage(p)} className="btn btn-sm" style={{ background: page === p ? 'var(--primary)' : 'transparent', color: page === p ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)', minWidth: '32px' }}>{p}</button>
                                    )
                                }
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-sm btn-secondary" style={{ opacity: page === totalPages ? 0.4 : 1 }}>Next →</button>
                            </div>
                        </div>
                    )}
                    </>
                )}
            </div>
        </div>


        {/* Right Column (Sidebar) */}
        <div className="dashboard-sidebar">
            <div className="card" style={{ borderLeft: notifications.filter(n => !n.read).length > 0 ? '4px solid #dc3545' : '4px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 600 }}>
                        <Bell style={{ color: notifications.filter(n => !n.read).length > 0 ? '#dc3545' : 'inherit' }} />
                        Notifications
                        {notifications.filter(n => !n.read).length > 0 && (
                            <span style={{
                                background: '#dc3545',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}>
                                {notifications.filter(n => !n.read).length} new
                            </span>
                        )}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {notifications.filter(n => !n.read).length > 0 && (
                            <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem' }}>
                                Mark all read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button onClick={deleteAllNotifications} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '0.85rem' }} title="Delete all">
                                <Trash2 style={{ width: 16, height: 16 }} />
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
                    {notifications.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                            No notifications yet.
                        </p>
                    ) : (
                        notifications.map(notif => {
                            const isExpanded = expandedNotifId === notif._id || !notif.read;
                            
                            return (
                                <div 
                                    key={notif._id}
                                    onClick={() => {
                                        if (notif.read) {
                                            setExpandedNotifId(isExpanded ? null : notif._id);
                                        } else {
                                            markAsRead(notif._id);
                                        }
                                    }}
                                    style={{
                                        background: notif.read ? 'var(--bg-card)' : 'rgba(201, 29, 46, 0.03)',
                                        border: `1px solid ${notif.read ? 'var(--border-color)' : 'rgba(201, 29, 46, 0.2)'}`,
                                        borderRadius: '8px',
                                        padding: '14px',
                                        transition: 'all 0.3s ease',
                                        cursor: notif.read ? 'pointer' : 'default'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                                {notif.type === 'general' ? 'UPDATE' : notif.type}
                                            </span>
                                            {!notif.read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc3545', display: 'inline-block' }}></span>}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                {new Date(notif.createdAt).toLocaleString()}
                                            </span>
                                            <button 
                                                onClick={(e) => deleteNotification(notif._id, e)}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}
                                            >
                                                <Trash2 style={{ width: 14, height: 14 }} />
                                            </button>
                                            {notif.read && (
                                                <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}>
                                                    {isExpanded ? <ChevronUp style={{ width: 16, height: 16 }} /> : <ChevronDown style={{ width: 16, height: 16 }} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 600 }}>{notif.title}</h4>
                                    
                                    {isExpanded && (
                                        <>
                                            <p style={{ margin: '0 0 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{notif.message}</p>
                                            {!notif.read && (
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                                    <button onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }} style={{ fontSize: '0.8rem', padding: '4px 14px', background: 'transparent', border: '1px solid var(--accent-green)', color: 'var(--accent-green)', borderRadius: '6px', cursor: 'pointer' }}>
                                                        Mark as read
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
    );
}

export default RequesterDashboard;
