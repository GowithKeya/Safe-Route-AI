import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { AlertTriangle, Navigation, Activity, ShieldAlert, MapPin, Search } from 'lucide-react';
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

const customAmbulanceIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v10H2v-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>'),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const customHospitalIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const customAccidentIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>'),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const center: [number, number] = [28.6139, 77.2090]; // New Delhi

const socket = io();

export default function Dashboard() {
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [tripProgress, setTripProgress] = useState(0);
  const [vehicles, setVehicles] = useState<Record<string, any>>({});
  const [dynamicETA, setDynamicETA] = useState<string | null>(null);
  const [routeCalculated, setRouteCalculated] = useState(false);
  const [accidents, setAccidents] = useState<[number, number][]>([
    [28.62, 77.21] // Mock accident
  ]);

  // Mock route from center to AIIMS
  const mockRoute: [number, number][] = [
    [28.6139, 77.2090],
    [28.5939, 77.2190],
    [28.5739, 77.2290],
    [28.5539, 77.2390],
    [28.5355, 77.2410] // AIIMS Delhi
  ];

  const hospitals: {pos: [number, number], name: string}[] = [
    { pos: [28.5355, 77.2410], name: "AIIMS Delhi" },
    { pos: [28.6389, 77.2227], name: "Lok Nayak Hospital" },
    { pos: [28.5844, 77.2345], name: "Safdarjung Hospital" }
  ];

  useEffect(() => {
    socket.on('vehicleLocationUpdate', (data) => {
      setVehicles(prev => ({ ...prev, [data.id]: data }));
    });

    return () => {
      socket.off('vehicleLocationUpdate');
    };
  }, []);

  const calculateRoute = async () => {
    setRouteCalculated(true);
    
    try {
      const origin = `${center[0]},${center[1]}`;
      const destination = `${hospitals[0].pos[0]},${hospitals[0].pos[1]}`;
      
      const response = await fetch(`/api/directions?origin=${origin}&destination=${destination}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes.length > 0 && data.routes[0].legs && data.routes[0].legs.length > 0) {
          const leg = data.routes[0].legs[0];
          // Use duration_in_traffic if available (requires BEST_GUESS traffic model and departure_time=now)
          const etaText = leg.duration_in_traffic ? leg.duration_in_traffic.text : leg.duration?.text;
          if (etaText) {
            setDynamicETA(etaText);
            return;
          }
        }
      }
      
      // Fallback if API fails or key is missing
      setDynamicETA("15 mins");
    } catch (error) {
      console.error("Error fetching route", error);
      setDynamicETA("15 mins");
    }
  };

  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const toggleEmergencyMode = () => {
    setEmergencyMode(!emergencyMode);
    if (!emergencyMode) {
      setTripProgress(0);
      // Simulate sending location and trip progress
      const id = setInterval(() => {
        setTripProgress(prev => {
          const next = prev + 2;
          return next > 100 ? 100 : next;
        });
        socket.emit('updateLocation', {
          id: 'AMB-101',
          lat: center[0] + (Math.random() - 0.5) * 0.01,
          lng: center[1] + (Math.random() - 0.5) * 0.01,
          timestamp: Date.now()
        });
      }, 3000);
      setIntervalId(id);
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      setTripProgress(0);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-red-500" />
            SafeRoute <span className="text-red-500">AI</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Emergency Control Center</p>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {/* Controls */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Active Operations</h3>
              <button 
                onClick={toggleEmergencyMode}
                className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                  emergencyMode 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                }`}
              >
                <Activity size={18} />
                {emergencyMode ? 'Emergency Mode Active' : 'Activate Emergency Mode'}
              </button>
            </div>

            <div>
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Routing</h3>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Destination (e.g. City Hospital)" 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <button 
                  onClick={calculateRoute}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Navigation size={16} />
                  Calculate AI Route
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Live Status</h3>
              <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800 space-y-4">
                {emergencyMode && (
                  <div className="flex flex-col items-center justify-center py-4 border-b border-zinc-800/50 mb-4">
                    <div className="relative w-32 h-32 mb-2">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="54"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-zinc-800"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="54"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 54}
                          strokeDashoffset={(2 * Math.PI * 54) - (tripProgress / 100) * (2 * Math.PI * 54)}
                          className="text-red-500 transition-all duration-1000 ease-linear"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-white">{tripProgress}%</span>
                        <span className="text-xs text-zinc-400 uppercase tracking-wider mt-1">Progress</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-400">ETA to Destination</span>
                  <span className="font-mono text-green-400">
                    {dynamicETA 
                      ? (emergencyMode ? `${Math.max(1, Math.floor(parseInt(dynamicETA) * (1 - tripProgress/100)))} mins` : dynamicETA) 
                      : (emergencyMode ? `${Math.max(1, Math.floor(12 * (1 - tripProgress/100)))} mins` : '12 mins')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-400">Traffic Prediction</span>
                  <span className="font-mono text-yellow-500">Moderate</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-400">Active Units</span>
                  <span className="font-mono text-white">{Object.keys(vehicles).length + (emergencyMode ? 1 : 0)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Reported Incidents</h3>
              <div className="space-y-2">
                {accidents.map((acc, i) => (
                  <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-medium text-red-200">Accident Reported</p>
                      <p className="text-xs text-red-400/70">Near Connaught Place • 2 mins ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative z-0">
        <MapContainer 
          center={center} 
          zoom={12} 
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {/* Current Location Marker */}
          <Marker position={center} icon={customAmbulanceIcon}>
            <Popup>
              <div className="text-zinc-900 font-medium">AMB-101 (Current Location)</div>
            </Popup>
          </Marker>

          {/* Hospitals */}
          {hospitals.map((hospital, i) => (
            <Marker key={`h-${i}`} position={hospital.pos} icon={customHospitalIcon}>
              <Popup>
                <div className="text-zinc-900 font-medium">{hospital.name}</div>
              </Popup>
            </Marker>
          ))}

          {/* Other Vehicles */}
          {Object.values(vehicles).map((v: any) => (
            <Marker 
              key={v.id} 
              position={[v.lat, v.lng]} 
              icon={customAmbulanceIcon}
            >
              <Popup>
                <div className="text-zinc-900 font-medium">{v.id}</div>
              </Popup>
            </Marker>
          ))}

          {/* Accidents */}
          {accidents.map((acc, i) => (
            <Marker key={`acc-${i}`} position={acc} icon={customAccidentIcon}>
              <Popup>
                <div className="text-red-600 font-medium">Reported Accident</div>
              </Popup>
            </Marker>
          ))}

          {/* Route */}
          {routeCalculated && (
            <Polyline 
              positions={mockRoute} 
              color={emergencyMode ? '#ef4444' : '#3b82f6'} 
              weight={6} 
              opacity={0.8} 
            />
          )}
        </MapContainer>

        {/* Overlay UI */}
        {emergencyMode && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full font-bold shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse flex items-center gap-3 z-[1000]">
            <AlertTriangle size={24} />
            EMERGENCY PRIORITY ROUTING ACTIVE
          </div>
        )}
      </div>
    </div>
  );
}
