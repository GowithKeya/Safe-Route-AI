import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { io } from 'socket.io-client';
import { AlertTriangle, Navigation, Activity, ShieldAlert, MapPin, Search } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 28.6139,
  lng: 77.2090 // New Delhi
};

const socket = io();

export default function Dashboard() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [tripProgress, setTripProgress] = useState(0);
  const [vehicles, setVehicles] = useState<Record<string, any>>({});
  const [dynamicETA, setDynamicETA] = useState<string | null>(null);
  const [accidents, setAccidents] = useState<{lat: number, lng: number}[]>([
    { lat: 28.62, lng: 77.21 } // Mock accident
  ]);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  useEffect(() => {
    socket.on('vehicleLocationUpdate', (data) => {
      setVehicles(prev => ({ ...prev, [data.id]: data }));
    });

    return () => {
      socket.off('vehicleLocationUpdate');
    };
  }, []);

  const calculateRoute = async () => {
    if (!window.google) return;
    
    // Mock route calculation
    const directionsService = new google.maps.DirectionsService();
    try {
      const results = await directionsService.route({
        origin: center,
        destination: { lat: 28.5355, lng: 77.2410 }, // AIIMS Delhi
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
        drivingOptions: {
          departureTime: new Date(Date.now()),  // for current traffic
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        }
      });
      setDirectionsResponse(results);
      
      if (results.routes && results.routes.length > 0 && results.routes[0].legs && results.routes[0].legs.length > 0) {
        const leg = results.routes[0].legs[0];
        // Use duration_in_traffic if available, otherwise fallback to duration
        const etaText = leg.duration_in_traffic ? leg.duration_in_traffic.text : leg.duration?.text;
        if (etaText) {
          setDynamicETA(etaText);
        }
      }
    } catch (error) {
      console.error("Error calculating route", error);
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
          lat: center.lat + (Math.random() - 0.5) * 0.01,
          lng: center.lng + (Math.random() - 0.5) * 0.01,
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
      <div className="flex-1 relative">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={13}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              styles: [
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                {
                  featureType: "administrative.locality",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#d59563" }],
                },
                {
                  featureType: "poi",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#d59563" }],
                },
                {
                  featureType: "poi.park",
                  elementType: "geometry",
                  stylers: [{ color: "#263c3f" }],
                },
                {
                  featureType: "poi.park",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#6b9a76" }],
                },
                {
                  featureType: "road",
                  elementType: "geometry",
                  stylers: [{ color: "#38414e" }],
                },
                {
                  featureType: "road",
                  elementType: "geometry.stroke",
                  stylers: [{ color: "#212a37" }],
                },
                {
                  featureType: "road",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#9ca5b3" }],
                },
                {
                  featureType: "road.highway",
                  elementType: "geometry",
                  stylers: [{ color: "#746855" }],
                },
                {
                  featureType: "road.highway",
                  elementType: "geometry.stroke",
                  stylers: [{ color: "#1f2835" }],
                },
                {
                  featureType: "road.highway",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#f3d19c" }],
                },
                {
                  featureType: "transit",
                  elementType: "geometry",
                  stylers: [{ color: "#2f3948" }],
                },
                {
                  featureType: "transit.station",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#d59563" }],
                },
                {
                  featureType: "water",
                  elementType: "geometry",
                  stylers: [{ color: "#17263c" }],
                },
                {
                  featureType: "water",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#515c6d" }],
                },
                {
                  featureType: "water",
                  elementType: "labels.text.stroke",
                  stylers: [{ color: "#17263c" }],
                },
              ],
              disableDefaultUI: true,
              zoomControl: true,
            }}
          >
            {/* Current Location Marker */}
            <Marker 
              position={center} 
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v10H2v-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>'),
                scaledSize: new window.google.maps.Size(32, 32),
              }}
            />

            {/* Other Vehicles */}
            {Object.values(vehicles).map((v: any) => (
              <Marker 
                key={v.id} 
                position={{ lat: v.lat, lng: v.lng }} 
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v10H2v-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>'),
                  scaledSize: new window.google.maps.Size(24, 24),
                }}
              />
            ))}

            {/* Accidents */}
            {accidents.map((acc, i) => (
              <Marker 
                key={i} 
                position={acc} 
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>'),
                  scaledSize: new window.google.maps.Size(32, 32),
                }}
              />
            ))}

            {directionsResponse && (
              <DirectionsRenderer 
                directions={directionsResponse} 
                options={{
                  polylineOptions: {
                    strokeColor: emergencyMode ? '#ef4444' : '#3b82f6',
                    strokeWeight: 6,
                    strokeOpacity: 0.8
                  },
                  suppressMarkers: true
                }}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        )}

        {/* Overlay UI */}
        {emergencyMode && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full font-bold shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse flex items-center gap-3">
            <AlertTriangle size={24} />
            EMERGENCY PRIORITY ROUTING ACTIVE
          </div>
        )}
      </div>
    </div>
  );
}
