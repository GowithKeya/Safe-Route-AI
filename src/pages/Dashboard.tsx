import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { AlertTriangle, Navigation, Activity, ShieldAlert, MapPin, Search, Layers, X, Clock, Settings2, Plus, Minus, Crosshair, ChevronLeft, ChevronRight, Home, Sparkles } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
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

const customFireIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>'),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const customPoliceIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const customHospitalIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const customPharmacyIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 20.5 19 12a4.949 4.949 0 0 0 0-7 4.949 4.949 0 0 0-7 0l-8.5 8.5a4.949 4.949 0 0 0 0 7 4.949 4.949 0 0 0 7 0Z"/><path d="m16.5 3.5 4 4"/><path d="m7.5 16.5 4 4"/></svg>'),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const customClinicIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>'),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const customVetIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3c0 1.6 1.4 3 3 3s3-1.4 3-3a3 3 0 0 0-3-3Z"/><path d="M19 8a2 2 0 0 0-2 2c0 1.1.9 2 2 2s2-.9 2-2a2 2 0 0 0-2-2Z"/><path d="M5 8a2 2 0 0 0-2 2c0 1.1.9 2 2 2s2-.9 2-2a2 2 0 0 0-2-2Z"/><path d="M12 10c-3.3 0-6 2.7-6 6v4h12v-4c0-3.3-2.7-6-6-6Z"/></svg>'),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const customAccidentIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>'),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const center: [number, number] = [28.6139, 77.2090]; // New Delhi

const socket = io();

// Map Controller Component
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo(center, zoom, {
      animate: true,
      duration: 1.5
    });
  }, [center, zoom, map]);

  return null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [tripProgress, setTripProgress] = useState(0);
  const [vehicles, setVehicles] = useState<Record<string, any>>({});
  const [dynamicETA, setDynamicETA] = useState<string | null>(null);
  const [routeCalculated, setRouteCalculated] = useState(false);
  const [accidents, setAccidents] = useState<[number, number][]>([
    [28.62, 77.21] // Mock accident
  ]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [fleet, setFleet] = useState<any[]>([]);
  const [showTraffic, setShowTraffic] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [vehiclePaths, setVehiclePaths] = useState<Record<string, {lat: number, lng: number, timestamp: number}[]>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [pathHistoryDuration, setPathHistoryDuration] = useState<number>(5); // in minutes
  
  // Route Preferences
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [routePreference, setRoutePreference] = useState<'fastest' | 'shortest'>('fastest');
  const [showPreferences, setShowPreferences] = useState(false);
  const [mapZoom, setMapZoom] = useState(12);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);

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
      const now = Date.now();
      setVehiclePaths(prev => {
        const next = { ...prev };
        if (!next[data.id]) next[data.id] = [];
        next[data.id].push({ lat: data.lat, lng: data.lng, timestamp: now });
        next[data.id] = next[data.id].filter(p => now - p.timestamp <= 600000); // Store up to 10 minutes max
        return next;
      });
    });
    
    socket.on('fleetUpdate', (data) => {
      setFleet(data);
      const now = Date.now();
      setVehiclePaths(prev => {
        const next = { ...prev };
        data.forEach((v: any) => {
          if (!next[v.id]) next[v.id] = [];
          next[v.id].push({ lat: v.lat, lng: v.lng, timestamp: now });
          next[v.id] = next[v.id].filter(p => now - p.timestamp <= 600000); // Store up to 10 minutes max
        });
        return next;
      });
    });

    // Fetch medical and emergency facilities from Overpass API
    const fetchFacilities = async () => {
      const query = `
        [out:json];
        (
          node["amenity"="hospital"](around:3000,${center[0]},${center[1]});
          node["amenity"="pharmacy"](around:3000,${center[0]},${center[1]});
          node["amenity"="clinic"](around:3000,${center[0]},${center[1]});
          node["amenity"="doctors"](around:3000,${center[0]},${center[1]});
          node["amenity"="veterinary"](around:3000,${center[0]},${center[1]});
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

    return () => {
      socket.off('vehicleLocationUpdate');
      socket.off('fleetUpdate');
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      
      const query = searchQuery.toLowerCase();
      const results: any[] = [];
      
      // Search static hospitals
      hospitals.forEach(h => {
        if (h.name.toLowerCase().includes(query)) {
          results.push({ id: `h-${h.name}`, name: h.name, type: 'Hospital', lat: h.pos[0], lng: h.pos[1] });
        }
      });
      
      // Search fetched facilities
      facilities.forEach(f => {
        const name = f.tags?.name || '';
        if (name.toLowerCase().includes(query)) {
          let typeName = "Hospital";
          if (f.tags?.amenity === 'pharmacy') typeName = "Pharmacy";
          else if (f.tags?.amenity === 'clinic' || f.tags?.amenity === 'doctors') typeName = "Clinic";
          else if (f.tags?.amenity === 'veterinary') typeName = "Veterinary";
          
          // Avoid duplicates if static hospital is also in fetched facilities
          if (!results.some(r => r.name === name)) {
            results.push({ id: f.id, name: name, type: typeName, lat: f.lat, lng: f.lon });
          }
        }
      });

      // AI/Nominatim Search for broader locations, addresses, and landmarks
      if (results.length < 5) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
          const data = await res.json();
          data.forEach((item: any) => {
            const name = item.display_name.split(',')[0];
            if (!results.some(r => r.name === name)) {
              results.push({
                id: `nom-${item.place_id}`,
                name: name,
                type: 'AI Suggestion',
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon)
              });
            }
          });
        } catch (e) {
          console.error("AI Search failed", e);
        }
      }
      
      setSearchResults(results.slice(0, 8));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, facilities]);

  const handleSelectFacility = (facility: any) => {
    setSearchQuery(facility.name);
    setSearchResults([]);
    setMapCenter([facility.lat, facility.lng]);
    setMapZoom(16);
    setDestinationCoords([facility.lat, facility.lng]);
  };

  const calculateRoute = async () => {
    setRouteCalculated(true);
    
    try {
      const origin = `${center[0]},${center[1]}`;
      const destination = destinationCoords ? `${destinationCoords[0]},${destinationCoords[1]}` : `${hospitals[0].pos[0]},${hospitals[0].pos[1]}`;
      
      let avoidParams = [];
      if (avoidTolls) avoidParams.push('tolls');
      if (avoidHighways) avoidParams.push('highways');
      const avoidStr = avoidParams.length > 0 ? `&avoid=${avoidParams.join('|')}` : '';
      
      const response = await fetch(`/api/directions?origin=${origin}&destination=${destination}${avoidStr}&preference=${routePreference}`);
      
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
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => navigate(-1)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-300 transition-colors" title="Go Back">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => navigate('/')} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-300 transition-colors ml-auto" title="Go Home">
              <Home size={16} />
            </button>
          </div>
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
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Map Layers</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowTraffic(!showTraffic)}
                  className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                    showTraffic 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                  }`}
                >
                  <Layers size={18} />
                  {showTraffic ? 'Hide Live Traffic' : 'Show Live Traffic'}
                </button>
                
                <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-zinc-400 flex items-center gap-2">
                      <Clock size={14} /> Path History
                    </span>
                    <span className="text-xs font-mono text-zinc-300">{pathHistoryDuration} min</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={pathHistoryDuration}
                    onChange={(e) => setPathHistoryDuration(parseInt(e.target.value))}
                    className="w-full accent-red-500"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1 px-1">
                    <span>1m</span>
                    <span>10m</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Routing</h3>
                <button 
                  onClick={() => setShowPreferences(!showPreferences)}
                  className={`p-1.5 rounded-md transition-colors ${showPreferences ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
                >
                  <Settings2 size={16} />
                </button>
              </div>
              
              <div className="space-y-3">
                {showPreferences && (
                  <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800 space-y-3 mb-3">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={avoidTolls}
                          onChange={(e) => setAvoidTolls(e.target.checked)}
                          className="rounded border-zinc-700 bg-zinc-900 text-red-500 focus:ring-red-500 focus:ring-offset-zinc-950"
                        />
                        Avoid Tolls
                      </label>
                      <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={avoidHighways}
                          onChange={(e) => setAvoidHighways(e.target.checked)}
                          className="rounded border-zinc-700 bg-zinc-900 text-red-500 focus:ring-red-500 focus:ring-offset-zinc-950"
                        />
                        Avoid Highways
                      </label>
                    </div>
                    
                    <div className="pt-2 border-t border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-2">Route Preference</p>
                      <div className="flex bg-zinc-900 rounded-lg p-1">
                        <button
                          onClick={() => setRoutePreference('fastest')}
                          className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${routePreference === 'fastest' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-300'}`}
                        >
                          Fastest
                        </button>
                        <button
                          onClick={() => setRoutePreference('shortest')}
                          className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${routePreference === 'shortest' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-300'}`}
                        >
                          Shortest
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="AI Search hospitals, clinics, addresses, landmarks..." 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-red-500 transition-colors"
                  />
                  
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50">
                      {searchResults.map(res => (
                        <button
                          key={res.id}
                          onClick={() => handleSelectFacility(res)}
                          className="w-full text-left px-4 py-2 hover:bg-zinc-800 flex flex-col transition-colors border-b border-zinc-800/50 last:border-0"
                        >
                          <span className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                            {res.type === 'AI Suggestion' && <Sparkles size={12} className="text-blue-400" />}
                            {res.name}
                          </span>
                          <span className="text-xs text-zinc-500">{res.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
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
                  <span className="font-mono text-white">{fleet.length + Object.keys(vehicles).length + (emergencyMode ? 1 : 0)}</span>
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

            {selectedVehicle && (
              <div className="mt-6 border-t border-zinc-800 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Unit Details</h3>
                  <button 
                    onClick={() => setSelectedVehicle(null)}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800 space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/50">
                    <div className={`p-2 rounded-full ${
                      selectedVehicle.type === 'ambulance' || selectedVehicle.id === 'AMB-101' ? 'bg-red-500/20 text-red-500' :
                      selectedVehicle.type === 'fire' ? 'bg-orange-500/20 text-orange-500' :
                      selectedVehicle.type === 'police' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-zinc-500/20 text-zinc-500'
                    }`}>
                      <Activity size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-none">{selectedVehicle.id}</p>
                      <p className="text-xs text-zinc-400 capitalize mt-1">{selectedVehicle.type || 'Emergency Unit'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">Status</span>
                      <span className={`text-sm font-medium ${
                        selectedVehicle.status?.includes('Responding') || selectedVehicle.status?.includes('En Route') || emergencyMode && selectedVehicle.id === 'AMB-101'
                          ? 'text-red-400' 
                          : 'text-green-400'
                      }`}>
                        {selectedVehicle.id === 'AMB-101' ? (emergencyMode ? 'Emergency Priority' : 'Standby') : selectedVehicle.status || 'Active'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">Coordinates</span>
                      <span className="font-mono text-xs text-zinc-300">
                        {selectedVehicle.lat.toFixed(4)}, {selectedVehicle.lng.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">Speed</span>
                      <span className="font-mono text-xs text-zinc-300">
                        {selectedVehicle.status?.includes('Responding') || selectedVehicle.status?.includes('En Route') ? '65 km/h' : '0 km/h'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-zinc-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-300">Show Historical Path</span>
                      <button 
                        onClick={() => setShowHistory(!showHistory)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${showHistory ? 'bg-blue-500' : 'bg-zinc-700'}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showHistory ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                    
                    {showHistory && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-zinc-500 mb-1">
                          <span>Path Duration</span>
                          <span className="text-blue-400 font-medium">{pathHistoryDuration} min</span>
                        </div>
                        <input 
                          type="range" 
                          min="1" 
                          max="10" 
                          value={pathHistoryDuration}
                          onChange={(e) => setPathHistoryDuration(parseInt(e.target.value))}
                          className="w-full accent-blue-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                          <span>1m</span>
                          <span>10m</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button className="w-full mt-2 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-xs font-medium transition-colors">
                    Contact Unit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative z-0">
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <MapController center={mapCenter} zoom={mapZoom} />
          <TileLayer
            url={showTraffic 
              ? "https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}"
              : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            }
            attribution={showTraffic 
              ? '&copy; Google Maps'
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }
          />

          {/* Vehicle Paths */}
          {showHistory && selectedVehicle && vehiclePaths[selectedVehicle.id] && (
            (() => {
              const path = vehiclePaths[selectedVehicle.id];
              const vehicle = fleet.find(v => v.id === selectedVehicle.id) || vehicles[selectedVehicle.id] || selectedVehicle;
              let color = '#ef4444'; // default ambulance red
              if (vehicle?.type === 'fire') color = '#f97316';
              else if (vehicle?.type === 'police') color = '#3b82f6';

              const now = Date.now();
              const filteredPath = path.filter((p: any) => now - p.timestamp <= pathHistoryDuration * 60000);

              if (filteredPath.length >= 2) {
                return (
                  <Polyline 
                    positions={filteredPath.map((p: any) => [p.lat, p.lng])}
                    color={color}
                    weight={4}
                    opacity={0.6}
                    dashArray="5, 10"
                  />
                );
              }
              return null;
            })()
          )}

          {/* Current Location Marker */}
          <Marker 
            position={center} 
            icon={customAmbulanceIcon}
            eventHandlers={{
              click: () => {
                setSelectedVehicle({
                  id: 'AMB-101',
                  type: 'ambulance',
                  lat: center[0],
                  lng: center[1],
                  status: emergencyMode ? 'Emergency Priority' : 'Standby'
                });
              },
            }}
          >
            <Popup>
              <div className="text-zinc-900 font-medium">AMB-101 (Current Location)</div>
              <div className="text-zinc-500 text-sm">Status: {emergencyMode ? 'Emergency Priority' : 'Standby'}</div>
            </Popup>
          </Marker>

          {/* Fetched Facilities */}
          {facilities.map((fac, i) => {
            let icon = customHospitalIcon;
            let typeName = "Hospital";
            if (fac.tags?.amenity === 'pharmacy') { icon = customPharmacyIcon; typeName = "Pharmacy"; }
            else if (fac.tags?.amenity === 'clinic' || fac.tags?.amenity === 'doctors') { icon = customClinicIcon; typeName = "Clinic/Doctor"; }
            else if (fac.tags?.amenity === 'veterinary') { icon = customVetIcon; typeName = "Veterinary"; }

            return (
              <Marker key={`fac-${fac.id}`} position={[fac.lat, fac.lon]} icon={icon}>
                <Popup>
                  <div className="text-zinc-900 font-medium">{fac.tags?.name || `Unnamed ${typeName}`}</div>
                  <div className="text-zinc-500 text-sm">{typeName}</div>
                </Popup>
              </Marker>
            );
          })}

          {/* Hospitals (Static Fallbacks) */}
          {hospitals.map((hospital, i) => (
            <Marker key={`h-${i}`} position={hospital.pos} icon={customHospitalIcon}>
              <Popup>
                <div className="text-zinc-900 font-medium">{hospital.name}</div>
                <div className="text-zinc-500 text-sm">Hospital</div>
              </Popup>
            </Marker>
          ))}

          {/* Simulated Fleet Vehicles */}
          {fleet.map((v) => {
            let icon = customAmbulanceIcon;
            if (v.type === 'fire') icon = customFireIcon;
            else if (v.type === 'police') icon = customPoliceIcon;

            return (
              <Marker 
                key={v.id} 
                position={[v.lat, v.lng]} 
                icon={icon}
                eventHandlers={{
                  click: () => setSelectedVehicle(v),
                }}
              >
                <Popup>
                  <div className="text-zinc-900 font-medium">{v.id}</div>
                  <div className="text-zinc-500 text-sm">Type: {v.type.toUpperCase()}</div>
                  <div className="text-zinc-500 text-sm">Status: {v.status}</div>
                </Popup>
              </Marker>
            );
          })}

          {/* Other User Vehicles */}
          {Object.values(vehicles).map((v: any) => (
            <Marker 
              key={v.id} 
              position={[v.lat, v.lng]} 
              icon={customAmbulanceIcon}
              eventHandlers={{
                click: () => setSelectedVehicle({ ...v, type: 'user vehicle', status: 'Active' }),
              }}
            >
              <Popup>
                <div className="text-zinc-900 font-medium">{v.id}</div>
                <div className="text-zinc-500 text-sm">User Vehicle</div>
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
        <div className="absolute right-6 bottom-6 flex flex-col gap-2 z-[1000]">
          <button 
            onClick={() => {
              setMapCenter(center);
              setMapZoom(14);
            }}
            className="bg-zinc-900/90 hover:bg-zinc-800 text-white p-3 rounded-xl shadow-lg border border-zinc-800/50 backdrop-blur-sm transition-all group"
            title="Center on my location"
          >
            <Crosshair size={20} className="group-hover:text-red-500 transition-colors" />
          </button>
          
          <div className="bg-zinc-900/90 rounded-xl shadow-lg border border-zinc-800/50 backdrop-blur-sm overflow-hidden flex flex-col mt-2">
            <button 
              onClick={() => setMapZoom(prev => Math.min(prev + 1, 18))}
              className="p-3 hover:bg-zinc-800 text-white transition-colors border-b border-zinc-800/50"
            >
              <Plus size={20} />
            </button>
            <button 
              onClick={() => setMapZoom(prev => Math.max(prev - 1, 3))}
              className="p-3 hover:bg-zinc-800 text-white transition-colors"
            >
              <Minus size={20} />
            </button>
          </div>
        </div>

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
