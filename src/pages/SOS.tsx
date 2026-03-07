import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Phone, MapPin, ShieldAlert, Navigation, Sun, Moon, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const customUserIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const customHospitalIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const customClinicIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>'),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const center: [number, number] = [28.6139, 77.2090]; // New Delhi

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function decodePolyline(encoded: string) {
  let points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

export default function SOS() {
  const [sosActive, setSosActive] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [facilities, setFacilities] = useState<any[]>([]);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [nearestFacility, setNearestFacility] = useState<any | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch medical and emergency facilities from Overpass API
    const fetchFacilities = async () => {
      const query = `
        [out:json];
        (
          node["amenity"="hospital"](around:3000,${center[0]},${center[1]});
          node["amenity"="clinic"](around:3000,${center[0]},${center[1]});
          node["amenity"="doctors"](around:3000,${center[0]},${center[1]});
        );
        out body;
      `;
      try {
        const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const data = await res.json();
        setFacilities(data.elements || []);
      } catch (e) {
        console.error("Failed to fetch facilities", e);
      }
    };

    fetchFacilities();
  }, []);

  const handleSOS = async () => {
    setSosActive(true);
    
    if (facilities.length > 0) {
      // Find nearest facility
      let nearest = facilities[0];
      let minDistance = getDistance(center[0], center[1], nearest.lat, nearest.lon);
      
      for (let i = 1; i < facilities.length; i++) {
        const dist = getDistance(center[0], center[1], facilities[i].lat, facilities[i].lon);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = facilities[i];
        }
      }
      
      setNearestFacility(nearest);
      
      // Fetch route
      try {
        const res = await fetch(`/api/directions?origin=${center[0]},${center[1]}&destination=${nearest.lat},${nearest.lon}`);
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const leg = data.routes[0].legs[0];
            const etaText = leg.duration_in_traffic ? leg.duration_in_traffic.text : leg.duration?.text;
            setEta(etaText);
            setDistance(leg.distance?.text);
            
            const encoded = data.routes[0].overview_polyline.points;
            setRoute(decodePolyline(encoded) as [number, number][]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch route", err);
      }
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${isDark ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-50">
        <button 
          onClick={() => navigate('/')}
          className={`flex items-center gap-2 font-medium transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
        >
          &larr; Back to Home
        </button>
        <button 
          onClick={toggleTheme}
          className={`p-2 rounded-full transition-colors ${isDark ? 'bg-zinc-800 text-yellow-400 hover:bg-zinc-700' : 'bg-white text-zinc-600 hover:bg-zinc-100 shadow-sm border border-zinc-200'}`}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mt-16 lg:mt-0">
        <div className="text-center space-y-8 flex flex-col items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Public SOS</h1>
            <p className={`text-lg ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Tap the button below in case of an emergency</p>
          </div>

          <div className="relative flex items-center justify-center py-12">
            {sosActive && (
              <>
                <motion.div 
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute w-48 h-48 bg-red-500 rounded-full"
                />
                <motion.div 
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                  className="absolute w-48 h-48 bg-red-500 rounded-full"
                />
              </>
            )}
            
            <button 
              onClick={handleSOS}
              className={`relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center gap-2 shadow-2xl transition-all ${
                sosActive 
                  ? 'bg-red-600 text-white shadow-[0_0_50px_rgba(239,68,68,0.8)]' 
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)]'
              }`}
            >
              <ShieldAlert size={48} />
              <span className="text-2xl font-bold tracking-widest">SOS</span>
            </button>
          </div>

          {sosActive && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`w-full max-w-md border rounded-2xl p-6 space-y-4 text-left ${isDark ? 'bg-zinc-900 border-red-500/30' : 'bg-white border-red-200 shadow-lg'}`}
            >
              <div className="flex items-center gap-3 text-red-500 font-medium">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Emergency Alert Broadcasted
              </div>

              {nearestFacility && (
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <h3 className={`text-xs uppercase tracking-wider font-semibold mb-3 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Nearest Facility Found</h3>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500/20 p-2 rounded-full text-green-500 shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="font-bold">{nearestFacility.tags?.name || 'Emergency Facility'}</p>
                        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {distance || 'Calculating...'} • <span className="text-red-500 font-medium">{eta || 'ETA unknown'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className={`space-y-3 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                <h3 className={`text-sm uppercase tracking-wider font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Emergency Contacts (India)</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <a href="tel:112" className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isDark ? 'bg-zinc-950 border-zinc-800 hover:border-red-500/50' : 'bg-zinc-50 border-zinc-200 hover:border-red-300'}`}>
                    <div className="bg-red-500/20 p-2 rounded-full text-red-500">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-none">112</p>
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>National Emergency</p>
                    </div>
                  </a>
                  <a href="tel:108" className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isDark ? 'bg-zinc-950 border-zinc-800 hover:border-blue-500/50' : 'bg-zinc-50 border-zinc-200 hover:border-blue-300'}`}>
                    <div className="bg-blue-500/20 p-2 rounded-full text-blue-500">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-none">108</p>
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Ambulance</p>
                    </div>
                  </a>
                  <a href="tel:100" className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isDark ? 'bg-zinc-950 border-zinc-800 hover:border-blue-500/50' : 'bg-zinc-50 border-zinc-200 hover:border-blue-300'}`}>
                    <div className="bg-blue-500/20 p-2 rounded-full text-blue-500">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-none">100</p>
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Police</p>
                    </div>
                  </a>
                  <a href="tel:101" className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isDark ? 'bg-zinc-950 border-zinc-800 hover:border-orange-500/50' : 'bg-zinc-50 border-zinc-200 hover:border-orange-300'}`}>
                    <div className="bg-orange-500/20 p-2 rounded-full text-orange-500">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-none">101</p>
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Fire</p>
                    </div>
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Map Section */}
        <div className={`w-full h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl border ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <MapContainer 
            center={center} 
            zoom={13} 
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url={isDark 
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              }
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {/* Current Location Marker */}
            <Marker position={center} icon={customUserIcon}>
              <Popup>
                <div className="text-zinc-900 font-medium">Your Location</div>
              </Popup>
            </Marker>

            {/* Fetched Facilities */}
            {facilities.map((fac, i) => {
              let icon = customHospitalIcon;
              let typeName = "Hospital";
              if (fac.tags?.amenity === 'clinic' || fac.tags?.amenity === 'doctors') { icon = customClinicIcon; typeName = "Clinic/Doctor"; }

              return (
                <Marker key={`fac-${fac.id}`} position={[fac.lat, fac.lon]} icon={icon}>
                  <Popup>
                    <div className="text-zinc-900 font-medium">{fac.tags?.name || `Unnamed ${typeName}`}</div>
                    <div className="text-zinc-500 text-sm">{typeName}</div>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${fac.lat},${fac.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Navigation size={14} /> Get Directions
                    </a>
                  </Popup>
                </Marker>
              );
            })}

            {/* Route to Nearest Facility */}
            {route && (
              <Polyline 
                positions={route} 
                color="#ef4444" 
                weight={6} 
                opacity={0.8} 
                dashArray="10, 10"
                className="animate-pulse"
              />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
