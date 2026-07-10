import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { MapPin, User, Activity } from 'lucide-react';

// Fix Leaflet's default icon path issues with bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Custom icons
const hospitalIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const donorIcon = new L.divIcon({
    className: 'custom-pulsing-icon',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
        <div class="animate-ping" style="position: absolute; width: 100%; height: 100%; background: #10B981; border-radius: 50%; opacity: 0.5;"></div>
        <div style="position: relative; width: 16px; height: 16px; background: #059669; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});

const carIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/741/741407.png', // A simple car/ambulance icon
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
});

function SmoothMarker({ position, icon, children }) {
    const markerRef = useRef(null);

    useEffect(() => {
        if (markerRef.current) {
            const marker = markerRef.current;
            const targetPos = L.latLng(position);
            
            // Add transition for smooth movement
            if (marker._icon) {
                marker._icon.style.transition = 'transform 1s linear';
            }
            marker.setLatLng(targetPos);
        }
    }, [position[0], position[1]]);

    return (
        <Marker ref={markerRef} position={position} icon={icon}>
            {children}
        </Marker>
    );
}

function RoutingControl({ source, destination, onRouteFound }) {
    const map = useMap();
    const routingControlRef = useRef(null);

    useEffect(() => {
        if (!map || !source || !destination) return;

        if (routingControlRef.current) {
            map.removeControl(routingControlRef.current);
        }

        const control = L.Routing.control({
            waypoints: [
                L.latLng(source.lat, source.lng),
                L.latLng(destination.lat, destination.lng)
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            fitSelectedRoutes: true,
            showAlternatives: false,
            lineOptions: {
                styles: [{ color: '#3b82f6', opacity: 0.8, weight: 6 }]
            },
            createMarker: function() { return null; } // We handle markers ourselves
        });

        control.on('routesfound', function(e) {
            const routes = e.routes;
            const summary = routes[0].summary;
            if (onRouteFound) {
                onRouteFound({
                    distance: (summary.totalDistance / 1000).toFixed(1), // in km
                    time: Math.round(summary.totalTime / 60) // in minutes
                });
            }
        });

        control.addTo(map);
        routingControlRef.current = control;

        return () => {
            if (routingControlRef.current) {
                map.removeControl(routingControlRef.current);
            }
        };
    }, [map, source, destination]);

    return null;
}

export default function LiveTrackerMap({ 
    hospitalLat, 
    hospitalLng, 
    donorLat, 
    donorLng, 
    donorName,
    hospitalName
}) {
    const [routeInfo, setRouteInfo] = useState(null);

    const hLat = parseFloat(hospitalLat) || 12.9716;
    const hLng = parseFloat(hospitalLng) || 77.5946;
    const center = [hLat, hLng];

    const dLat = parseFloat(donorLat);
    const dLng = parseFloat(donorLng);
    
    const hasDonorLocation = !isNaN(dLat) && !isNaN(dLng);

    return (
        <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-lg border border-gray-200 z-0">
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Hospital Marker */}
                <Marker position={[hLat, hLng]} icon={hospitalIcon}>
                    <Popup className="custom-popup">
                        <div className="font-bold text-red-600 text-base mb-1">Emergency Location</div>
                        <div className="text-sm text-gray-600">{hospitalName || 'Hospital'}</div>
                    </Popup>
                </Marker>

                {/* Donor Marker */}
                {hasDonorLocation && (
                    <SmoothMarker position={[dLat, dLng]} icon={donorIcon}>
                        <Popup>
                            <div className="p-1">
                                <div className="font-bold mb-1">{donorName || 'Donor'}</div>
                                <div className="text-sm text-blue-600">Currently En Route</div>
                            </div>
                        </Popup>
                    </SmoothMarker>
                )}

                {/* Route */}
                {hasDonorLocation && (
                    <RoutingControl 
                        source={{ lat: dLat, lng: dLng }} 
                        destination={{ lat: hLat, lng: hLng }}
                        onRouteFound={setRouteInfo}
                    />
                )}
            </MapContainer>

            {/* Overlay Info Box */}
            {hasDonorLocation && routeInfo && (
                <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-100 max-w-xs animate-in fade-in slide-in-from-top-4">
                    <h4 className="font-bold text-sm mb-3 text-gray-800 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500 animate-pulse" /> Live Trip Status
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                            <div className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wider">ETA</div>
                            <div className="text-xl font-extrabold text-blue-900">{routeInfo.time} <span className="text-sm font-normal">min</span></div>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-2 text-center">
                            <div className="text-xs text-emerald-600 font-semibold mb-1 uppercase tracking-wider">Distance</div>
                            <div className="text-xl font-extrabold text-emerald-900">{routeInfo.distance} <span className="text-sm font-normal">km</span></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
