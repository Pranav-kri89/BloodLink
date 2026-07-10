import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { CheckCircle2, ChevronRight, Activity, Users, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import LiveTrackerMap from '../components/LiveTrackerMap';

import React from 'react';

class MapErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Map rendering error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>📍 Live tracking map is temporarily unavailable. The rest of tracking details are active.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function RequestTrackingPage() {
    const { id } = useParams();
    const { token } = useAuth();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch request details directly by ID
        const fetchRequest = async () => {
            if (!token) return;
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get(`/api/requests/${id}`, config);
                setRequest(res.data);
            } catch (error) {
                console.error('Failed to fetch request:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();

        // Real-time tracking updates
        const socket = io(SOCKET_URL);
        socket.emit('joinTrackingRoom', { requestId: id });

        socket.on(`request_update_${id}`, (updatedData) => {
            setRequest(prev => ({ ...prev, ...updatedData }));
        });
        socket.on('request_accepted', ({ requestId, status, donorId }) => {
            if (requestId === id) {
                setRequest(prev => prev ? { ...prev, status, donorId } : prev);
            }
        });
        socket.on('trackingStarted', (data) => {
            setRequest(prev => prev ? { ...prev, liveLocation: data.liveLocation } : prev);
        });
        socket.on('donorLocationChanged', (data) => {
            setRequest(prev => prev ? { ...prev, liveLocation: { ...prev.liveLocation, ...data } } : prev);
        });
        socket.on('donorArrived', () => {
            setRequest(prev => prev ? { ...prev, status: 'arrived' } : prev);
        });

        return () => socket.disconnect();
    }, [id, token]);

    if (loading) return <div className="flex justify-center py-20"><div className="spinner"></div></div>;
    if (!request) return <div className="text-center py-20">Request not found.</div>;

    const notifiedCountToShow = request.notifiedDonors !== undefined ? request.notifiedDonors : (request.notifiedCount || 0);

    const isTravelling = !!request.liveLocation;
    const isArrived = request.status === 'arrived';
    const isFulfilled = request.status === 'fulfilled';
    const isAccepted = request.status === 'accepted' || isTravelling || isArrived || isFulfilled;

    const steps = [
        { id: 1, title: 'Waiting', desc: 'Searching nearby donors...', completed: true },
        { id: 2, title: 'Accepted', desc: isAccepted ? 'Donor has accepted' : 'Waiting for donor', completed: isAccepted, pulse: request.status === 'pending' },
        { id: 3, title: 'Travelling', desc: isTravelling ? 'Donor is on the way' : 'Waiting for donor to start journey', completed: isTravelling || isArrived || isFulfilled, pulse: isTravelling && !isArrived },
        { id: 4, title: 'Arrived', desc: isArrived || isFulfilled ? 'Donor has reached the hospital' : 'Pending', completed: isArrived || isFulfilled, pulse: isArrived && !isFulfilled },
        { id: 5, title: 'Completed', desc: 'Donation finished', completed: isFulfilled }
    ];

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="mb-6">
                <Link to="/requester-dashboard" className="text-primary hover:underline flex items-center gap-1 mb-4">
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to Dashboard
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] font-heading">Emergency Request Tracking</h1>
                        <p className="text-[var(--text-muted)] text-sm mt-1">Request ID: <span className="font-mono">{request.id || request._id}</span></p>
                    </div>
                    <div className="bg-[rgba(201,29,46,0.05)] text-[var(--primary)] px-4 py-2 border border-[rgba(201,29,46,0.1)] rounded-md font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Activity className="w-4 h-4 animate-pulse" />
                        Live Status
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="bg-card rounded-md p-5 shadow-sm border border-color">
                    <div className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-1">Blood Group</div>
                    <div className="text-3xl font-extrabold text-[var(--primary)]">{request.bloodGroup}</div>
                </div>
                <div className="bg-card rounded-md p-5 shadow-sm border border-color">
                    <div className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-1">Units Needed</div>
                    <div className="text-3xl font-extrabold text-[var(--text-primary)]">{request.unitsNeeded} Units</div>
                </div>
                <div className="bg-card rounded-md p-5 shadow-sm border border-color">
                    <div className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-1">Status</div>
                    <div className="text-3xl font-extrabold text-[var(--primary)] capitalize">{request.status}</div>
                </div>
            </div>

            {/* Donor Info (If accepted) */}
            {request.status === 'accepted' && request.donor && (
                <div className="bg-card rounded-md p-6 shadow-sm border border-color mb-8">
                    <h3 className="text-lg font-bold mb-4 text-[var(--text-primary)] font-heading">Accepting Donor</h3>
                    <div className="flex items-center gap-4">
                        <div style={{
                            width: 60, height: 60, borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(230,57,70,0.2), rgba(255,90,95,0.1))',
                            border: '2px solid var(--primary)',
                            overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)'
                        }}>
                            {request.donor.profilePicture ? (
                                <img src={request.donor.profilePicture} alt={request.donor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                request.donor.name?.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-[var(--text-primary)]">{request.donor.name}</h4>
                            <p className="text-sm text-[var(--text-muted)]">Verified Blood Donor</p>
                            {request.donor.phone && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const hasCalled = localStorage.getItem(`called_donor_${request.id}`);
                                            if (hasCalled && !window.confirm("You have already called this donor. Call again?")) return;
                                            localStorage.setItem(`called_donor_${request.id}`, new Date().toISOString());
                                            window.location.href = `tel:${request.donor.phone}`;
                                        }}
                                        className="inline-flex items-center gap-2 text-[var(--primary)] font-semibold bg-[rgba(201,29,46,0.05)] hover:bg-[rgba(201,29,46,0.1)] px-4 py-2 rounded-md border border-[rgba(201,29,46,0.2)] transition-colors"
                                    >
                                        📞 Call Donor: {request.donor.phone}
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.location.href = 'tel:108'; // Standard Indian emergency number
                                        }}
                                        className="inline-flex items-center gap-2 text-red-600 font-semibold bg-red-50 hover:bg-red-100 px-4 py-2 rounded-md border border-red-200 transition-colors"
                                        title="Emergency Medical Services"
                                    >
                                        🚨 Emergency (108)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-card rounded-md p-6 shadow-sm border border-color mb-8">
                <h3 className="text-lg font-bold mb-6 text-[var(--text-primary)] font-heading">Live Progress</h3>
                <div className="relative">
                    {/* Line connecting steps */}
                    <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-[var(--border-color)]"></div>

                    <div className="space-y-6 relative z-10">
                        {steps.map((step, index) => (
                            <motion.div 
                                key={step.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.15 }}
                                className="flex gap-5 items-start"
                            >
                                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-4 border-[var(--bg-card)] shadow-sm ${step.completed ? 'bg-[var(--accent-green)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'} ${step.pulse ? 'animate-pulse bg-[var(--accent-blue)] text-white' : ''}`}>
                                    {step.completed ? <CheckCircle2 className="w-5 h-5" /> : <div className="font-bold text-sm">{step.id}</div>}
                                </div>
                                <div className="pt-1.5">
                                    <h4 className={`text-base font-bold ${step.completed ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{step.title}</h4>
                                    <p className="text-[var(--text-muted)] text-sm">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Donor Map Integration */}
            {request && (
                <div className="mb-8">
                    <h3 className="text-lg font-bold mb-4 text-[var(--text-primary)] font-heading">Nearby Donors Map</h3>
                    <div className="rounded-md overflow-hidden border border-color">
                        <MapErrorBoundary>
                            {(() => {
                                const cityCoordinates = {
                                    'Mangaluru': { lat: 12.9141, lng: 74.8560 },
                                    'Udupi': { lat: 13.3409, lng: 74.7421 },
                                    'Manipal': { lat: 13.3525, lng: 74.7928 },
                                    'Puttur': { lat: 12.7687, lng: 75.2071 },
                                    'Bantwal': { lat: 12.8906, lng: 75.0357 },
                                    'Kasaragod': { lat: 12.4984, lng: 74.9895 },
                                    'Kanhangad': { lat: 12.3186, lng: 75.0882 },
                                    'Nileshwar': { lat: 12.2570, lng: 75.1218 },
                                    'Kumbla': { lat: 12.5937, lng: 74.9472 },
                                    'Manjeshwar': { lat: 12.7153, lng: 74.8872 }
                                };
                                const hospitalCoordinates = {
                                    // Mangaluru
                                    'A.J. Hospital & Research Centre': { lat: 12.9056, lng: 74.8354 },
                                    'Father Muller Medical College Hospital': { lat: 12.8687, lng: 74.8560 },
                                    'Indiana Hospital & Heart Institute': { lat: 12.8617, lng: 74.8601 },
                                    'KMC Hospital': { lat: 12.8712, lng: 74.8465 },
                                    'Omega Hospital': { lat: 12.8804, lng: 74.8517 },
                                    'SCS Hospital': { lat: 12.8767, lng: 74.8524 },
                                    'Unity Hospital': { lat: 12.8710, lng: 74.8521 },
                                    'Yenepoya Hospital': { lat: 12.8705, lng: 74.8468 },
                                    // Kasaragod
                                    'Carewell Hospital': { lat: 12.5114, lng: 74.9982 },
                                    'General Hospital': { lat: 12.5034, lng: 74.9877 },
                                    'Kims Hospital': { lat: 12.5100, lng: 74.9930 },
                                    'Sunrise Hospital': { lat: 12.5190, lng: 74.9925 },
                                    'United Hospital': { lat: 12.5048, lng: 74.9863 },
                                    // Udupi
                                    'Adarsha Hospital': { lat: 13.3385, lng: 74.7431 },
                                    'Lombard Memorial Hospital': { lat: 13.3308, lng: 74.7482 },
                                    'District Hospital Udupi': { lat: 13.3355, lng: 74.7455 },
                                    // Manipal
                                    'Kasturba Hospital (KMC)': { lat: 13.3525, lng: 74.7928 },
                                    'TMA Pai Hospital': { lat: 13.3409, lng: 74.7421 },
                                    // Puttur
                                    'Mahaveera Hospital': { lat: 12.7687, lng: 75.2071 },
                                    'Pragathi Specialty Hospital': { lat: 12.7710, lng: 75.2010 },
                                    'Government Hospital Puttur': { lat: 12.7650, lng: 75.2050 },
                                    // Bantwal
                                    'Government Hospital Bantwal': { lat: 12.8900, lng: 75.0350 },
                                    'Sparsha Hospital Bantwal': { lat: 12.8910, lng: 75.0360 },
                                    // Kanhangad
                                    'Mansoor Hospital': { lat: 12.3200, lng: 75.0890 },
                                    'District Hospital Kanhangad': { lat: 12.3150, lng: 75.0850 },
                                    'Sanjeevani Hospital': { lat: 12.3170, lng: 75.0900 },
                                    // Nileshwar
                                    'Taluk Hospital Nileshwar': { lat: 12.2570, lng: 75.1218 },
                                    'Thejaswini Hospital': { lat: 12.2590, lng: 75.1200 },
                                    // Kumbla
                                    'Kumbla Cooperative Hospital': { lat: 12.5937, lng: 74.9472 },
                                    'Community Health Centre Kumbla': { lat: 12.5950, lng: 74.9450 },
                                    // Manjeshwar
                                    'CHC Manjeshwar': { lat: 12.7153, lng: 74.8872 },
                                    'Saamudayika Arogya Kendra': { lat: 12.7130, lng: 74.8890 }
                                };
                                const fallback = hospitalCoordinates[request.hospital] || cityCoordinates[request.city] || { lat: 12.9716, lng: 77.5946 };
                                const hLat = request.latitude || fallback.lat;
                                const hLng = request.longitude || fallback.lng;
                                
                                return (
                                    <div className="relative">
                                        <LiveTrackerMap 
                                            hospitalName={request.hospital} 
                                            hospitalLat={hLat} 
                                            hospitalLng={hLng} 
                                            donorName={request.donor?.name}
                                            donorLat={request.liveLocation?.latitude}
                                            donorLng={request.liveLocation?.longitude}
                                        />
                                        {isTravelling && request.liveLocation && (
                                            <div className="absolute top-4 left-4 z-[1000]">
                                                <a 
                                                    href={`https://www.google.com/maps/dir/?api=1&origin=${request.liveLocation.latitude},${request.liveLocation.longitude}&destination=${encodeURIComponent(request.hospital + ', ' + request.city)}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="bg-white/90 backdrop-blur text-[var(--accent-blue)] px-3 py-2 rounded-md shadow-sm border border-blue-100 text-sm font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors"
                                                    title="Open route in Google Maps"
                                                >
                                                    <MapPin className="w-4 h-4" /> Open in Google Maps
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </MapErrorBoundary>
                    </div>
                </div>
            )}

            <div className="bg-card rounded-md p-5 border border-[rgba(2,132,199,0.15)] bg-[rgba(2,132,199,0.02)]">
                <h3 className="font-bold flex items-center gap-2 mb-3 text-[var(--accent-blue)] text-sm uppercase tracking-wider"><Users className="w-4 h-4" /> Live Updates</h3>
                <ul className="space-y-2">
                    <li className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                        <CheckCircle2 className="w-4 h-4 text-[var(--accent-green)]" /> {notifiedCountToShow} local donors have been notified via Email/SMS.
                    </li>
                    <li className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                        <CheckCircle2 className="w-4 h-4 text-[var(--accent-green)]" /> Request broadcasted to Live Emergency Dashboard.
                    </li>
                    {request.status === 'pending' && (
                        <li className="flex items-center gap-3 text-sm font-semibold text-[var(--accent-blue)]">
                            <Clock className="w-4 h-4 animate-spin" /> Waiting for donor response...
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
