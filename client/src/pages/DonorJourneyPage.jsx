import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { Navigation, MapPin, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import LiveTrackerMap from '../components/LiveTrackerMap';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function DonorJourneyPage() {
    const { id } = useParams();
    const { token, user } = useAuth();
    const navigate = useNavigate();
    
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isTracking, setIsTracking] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [donorLocation, setDonorLocation] = useState(null);
    
    const watchIdRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get(`/api/requests/${id}`, config);
                setRequest(res.data);
                if (res.data.liveLocation) {
                    setIsTracking(true);
                    setDonorLocation({
                        lat: res.data.liveLocation.latitude,
                        lng: res.data.liveLocation.longitude
                    });
                }
            } catch (error) {
                console.error('Failed to fetch request:', error);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchRequest();

        socketRef.current = io(SOCKET_URL);
        
        return () => {
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [id, token]);

    const startJourney = async () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser');
            return;
        }

        setLocationError('');
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setDonorLocation({ lat: latitude, lng: longitude });
                setIsTracking(true);

                try {
                    const config = { headers: { Authorization: `Bearer ${token}` } };
                    await axios.post(`/api/requests/${id}/journey`, { latitude, longitude }, config);
                    
                    // Start watching
                    watchIdRef.current = navigator.geolocation.watchPosition(
                        async (pos) => {
                            const lat = pos.coords.latitude;
                            const lng = pos.coords.longitude;
                            const speed = pos.coords.speed;
                            const heading = pos.coords.heading;
                            
                            setDonorLocation({ lat, lng });
                            
                            // Send to backend
                            await axios.put(`/api/requests/${id}/journey/location`, {
                                latitude: lat,
                                longitude: lng,
                                speed,
                                heading
                            }, config);
                        },
                        (err) => {
                            console.error("Watch position error:", err);
                        },
                        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
                    );
                } catch (err) {
                    console.error("Failed to start journey API call:", err);
                    setLocationError('Failed to start journey. Check network.');
                    setIsTracking(false);
                }
            },
            (error) => {
                setLocationError('Please allow location access to start tracking.');
            },
            { enableHighAccuracy: true }
        );
    };

    const markArrived = async () => {
        if (!window.confirm("Are you sure you have arrived at the hospital?")) return;
        
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`/api/requests/${id}/status`, { status: 'arrived' }, config);
            
            if (socketRef.current) {
                socketRef.current.emit('arrivedAtHospital', { requestId: id });
            }
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            navigate('/donor-dashboard');
        } catch (error) {
            console.error('Failed to mark arrived:', error);
            alert('Failed to mark as arrived');
        }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="spinner"></div></div>;
    if (!request) return <div className="text-center py-20">Request not found.</div>;

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
    
    const hospitalLat = request.latitude || fallback.lat;
    const hospitalLng = request.longitude || fallback.lng;

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(request.hospital + ', ' + request.city)}&dir_action=navigate`;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Link to="/donor-dashboard" className="text-primary hover:underline flex items-center gap-1 mb-6">
                <ChevronRight className="w-4 h-4 rotate-180" /> Back to Dashboard
            </Link>

            <div className="bg-card rounded-xl p-6 shadow-sm border border-color mb-8">
                <h1 className="text-2xl font-bold mb-2">Emergency Donation Journey</h1>
                <p className="text-[var(--text-muted)] mb-6">Patient: {request.patientName} • Blood Group: {request.bloodGroup} • Hospital: {request.hospital}</p>

                {locationError && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <p>{locationError}</p>
                    </div>
                )}

                {!isTracking && request.status !== 'arrived' && request.status !== 'fulfilled' && (
                    <div className="text-center p-8 bg-[var(--bg-secondary)] rounded-lg border border-color">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Navigation className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Ready to save a life?</h3>
                        <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
                            Start your journey to share your live location with the patient's attender so they know exactly when you'll arrive.
                        </p>
                        <button onClick={startJourney} className="btn btn-primary btn-lg flex items-center gap-2 mx-auto">
                            <Navigation className="w-5 h-5" /> Start Live Journey
                        </button>
                    </div>
                )}

                {isTracking && (
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-blue-50 border border-blue-100 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                            <div>
                                <h4 className="font-bold text-blue-900">Live Tracking Active</h4>
                                <p className="text-sm text-blue-700">Your location is being shared with the requester.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn btn-secondary flex items-center gap-2 font-bold text-[var(--accent-blue)]">
                                <MapPin className="w-4 h-4" /> Start Navigation
                            </a>
                            <button onClick={markArrived} className="btn btn-success flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> I've Arrived
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-xl overflow-hidden border border-color shadow-sm">
                <LiveTrackerMap 
                    hospitalName={request.hospital}
                    hospitalLat={hospitalLat}
                    hospitalLng={hospitalLng}
                    donorName={user?.name}
                    donorLat={donorLocation?.lat}
                    donorLng={donorLocation?.lng}
                />
            </div>
        </div>
    );
}
