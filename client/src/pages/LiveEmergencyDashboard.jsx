import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Droplet, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function LiveEmergencyDashboard() {
    const { user, token } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch initial active requests
        const fetchActiveRequests = async () => {
            try {
                const res = await axios.get('/api/requests/active');
                setRequests(res.data);
            } catch (error) {
                console.error('Failed to fetch active requests:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActiveRequests();

        // Socket.io connection
        const socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('Connected to live dashboard stream');
        });

        socket.on('new_emergency_request', (newRequest) => {
            console.log('New request received!', newRequest);
            setRequests((prev) => [newRequest, ...prev]);
        });

        socket.on('request_accepted', ({ requestId, status, donorId }) => {
            console.log('Request accepted by a donor!', requestId);
            setRequests(prev => prev.map(req => 
                (req.id === requestId || req._id === requestId)
                ? { ...req, status, donorId }
                : req
            ));
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleAcceptRequest = async (requestId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`/api/requests/${requestId}/accept`, {}, config);
            alert("Thank you! You have accepted the request. Redirecting to your live journey dashboard...");
            window.location.href = `/donor-journey/${requestId}`;
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to accept request');
        }
    };

    const getTimeAgo = (dateString) => {
        const diff = Math.floor((new Date() - new Date(dateString)) / 60000);
        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff} mins ago`;
        return `${Math.floor(diff / 60)} hours ago`;
    };

    return (
        <div className="page-container" style={{ minHeight: '80vh', maxWidth: '800px' }}>
            <div className="page-header flex items-center justify-between mb-8">
                <h1 className="flex items-center gap-3 text-primary">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-650" style={{ background: 'var(--primary)' }}></span>
                    </span>
                    Live Emergency Feed
                </h1>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="spinner"></div></div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12 text-secondary-foreground bg-card border border-color rounded-lg">
                    <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-lg">No active emergencies at the moment.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence>
                        {requests.map((request) => (
                            <motion.div
                                key={request.id || request._id}
                                initial={{ opacity: 0, y: -15, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.3 }}
                                className={`p-6 rounded-lg border relative overflow-hidden transition-all duration-350 hover:shadow-md ${
                                    request.urgency === 'critical' 
                                    ? 'bg-red-50/20 border-red-200 dark:bg-red-950/10 dark:border-red-900/40' 
                                    : 'bg-card border-color'
                                }`}
                            >
                                {request.urgency === 'critical' && (
                                    <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1 rounded-bl-lg text-xs font-bold tracking-wider uppercase">
                                        Critical
                                    </div>
                                )}
                                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                    <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-red-50 dark:bg-red-950/25 flex flex-col items-center justify-center border border-red-100/50 dark:border-red-900/30">
                                        <Droplet className="h-6 w-6 text-primary mb-1" />
                                        <span className="text-lg font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>{request.bloodGroup}</span>
                                    </div>
                                    
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 text-muted text-sm mb-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{getTimeAgo(request.createdAt)}</span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-primary mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                                            {request.unitsNeeded} Unit{request.unitsNeeded > 1 ? 's' : ''} needed for {request.patientName}
                                        </h3>
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div className="flex items-center gap-1.5 text-secondary">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                {request.hospital}, {request.city}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-secondary">
                                                <User className="w-4 h-4 text-primary" />
                                                Req by: {request.requester?.name || 'Unknown'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-auto flex flex-col items-end gap-1.5 border-t md:border-t-0 md:border-l border-color pt-4 md:pt-0 md:pl-6">
                                        <div className="text-xs font-medium text-muted uppercase tracking-wider">Status</div>
                                        {request.status === 'accepted' ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                <span className="font-semibold text-emerald-600 dark:text-emerald-500">Accepted</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                                    <span className="font-semibold text-amber-600 dark:text-amber-500">Searching...</span>
                                                </div>
                                                {request.notifiedDonors > 0 && (
                                                    <div className="text-xs text-muted">
                                                        {request.notifiedDonors} notified
                                                    </div>
                                                )}
                                                {user && user.role === 'donor' && request.requesterId !== user.id && request.requesterId !== user._id && (
                                                    <button
                                                        onClick={() => handleAcceptRequest(request.id || request._id)}
                                                        className="btn btn-sm btn-primary mt-2"
                                                        style={{ fontSize: '0.8rem', padding: '6px 12px', whiteSpace: 'nowrap' }}
                                                    >
                                                        🩸 Accept
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
