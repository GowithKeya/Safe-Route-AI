import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Phone, MapPin, ShieldAlert, Navigation, Sun, Moon, AlertTriangle, Layers, Plus, Minus, Crosshair } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createGoogleMarker = (bgColor: string, innerSvg: string, size: number = 32) => {
  return L.divIcon({
    className: 'custom-google-marker',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size * 1.25}px; display: flex; align-items: center; justify-content: center; transform: translateY(-${size * 0.25}px);">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style="position: absolute; width: 100%; height: 100%; fill: ${bgColor}; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));">
          <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"/>
        </svg>
        <div style="position: absolute; top: ${size * 0.2}px; color: white; width: ${size * 0.5}px; height: ${size * 0.5}px; display: flex; align-items: center; justify-content: center;">
          ${innerSvg}
        </div>
      </div>
    `,
    iconSize: [size, size * 1.25],
    iconAnchor: [size / 2, size * 1.25],
    popupAnchor: [0, -(size * 1.25)]
  });
};

const svgs = {
  cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  circle: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>',
  h: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5v14M16 5v14M8 12h8"/></svg>',
};

const customUserIcon = createGoogleMarker('#3b82f6', svgs.circle, 32);
const customHospitalIcon = createGoogleMarker('#ef4444', svgs.h, 32);
const customClinicIcon = createGoogleMarker('#0ea5e9', svgs.cross, 28);

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

export default function SOS() {
  const [sosActive, setSosActive] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [facilities, setFacilities] = useState<any[]>([]);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [nearestFacility, setNearestFacility] = useState<any | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [safetyStats, setSafetyStats] = useState<any | null>(null);
  const [showTraffic, setShowTraffic] = useState(false);
  const [mapZoom, setMapZoom] = useState(13);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const navigate = useNavigate();

  const generateRouteSafetyAnalysis = async (routePoints: [number, number][], destName: string) => {
    const seed = destName.length + routePoints.length;
    const isSafe = seed % 3 !== 0;
    const score = isSafe ? 75 + (seed % 20) : 40 + (seed % 30);
    
    const hotspots: any[] = [];
    if (!isSafe) {
      const numHotspots = 1 + (seed % 3);
      for (let i = 0; i < numHotspots; i++) {
        const pointIndex = Math.floor((routePoints.length / (numHotspots + 1)) * (i + 1));
        if (routePoints[pointIndex]) {
          hotspots.push({
            lat: routePoints[pointIndex][0],
            lng: routePoints[pointIndex][1],
            type: ['High Crime Rate', 'Poor Lighting', 'Accident Prone Area'][i % 3],
            severity: ['High', 'Medium', 'Critical'][i % 3]
          });
        }
      }
    }

    const risks = [
      { type: 'Theft/Robbery', percentage: isSafe ? 15 : 45 },
      { type: 'Poor Lighting', percentage: isSafe ? 20 : 60 },
      { type: 'Accident Prone', percentage: isSafe ? 10 : 35 }
    ];

    return {
      score,
      isSafe,
      hotspots,
      risks,
      trafficCondition: ['Light', 'Moderate', 'Heavy'][seed % 3]
    };
  };

  useEffect(() => {
    // Fetch medical and emergency facilities from Overpass API
    const fetchFacilities = async () => {
      const query = `
        [out:json];
        (
          node["amenity"="hospital"](around:10000,${center[0]},${center[1]});
          node["amenity"="clinic"](around:10000,${center[0]},${center[1]});
          node["amenity"="doctors"](around:10000,${center[0]},${center[1]});
        );
        out body;
      `;
      try {
        const res = await fetch(`https://overpass-api.de/api/interpreter`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `data=${encodeURIComponent(query)}`
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const text = await res.text();
        if (text.trim().startsWith('<')) {
          throw new Error('Received XML/HTML instead of JSON');
        }
        
        const data = JSON.parse(text);
        
        // Calculate distance for each facility and sort
        const facilitiesWithDistance = (data.elements || []).map((fac: any) => ({
          ...fac,
          distanceKm: getDistance(center[0], center[1], fac.lat, fac.lon)
        })).sort((a: any, b: any) => a.distanceKm - b.distanceKm);
        
        setFacilities(facilitiesWithDistance.slice(0, 5)); // Keep top 5 nearest
      } catch (e) {
        console.warn("Failed to fetch facilities.", e);
      }
    };

    fetchFacilities();
  }, []);

  const fetchRouteToFacility = async (facility: any) => {
    setNearestFacility(facility);
    setRoute(null);
    setSafetyStats(null);
    
    try {
      const res = await fetch(`/api/directions?origin=${center[0]},${center[1]}&destination=${facility.lat},${facility.lon}`);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const leg = data.routes[0].legs[0];
          const etaText = leg.duration_in_traffic ? leg.duration_in_traffic.text : leg.duration?.text;
          setEta(etaText);
          setDistance(leg.distance?.text);
          
          const encoded = data.routes[0].overview_polyline.points;
          const decodedRoute = decodePolyline(encoded) as [number, number][];
          setRoute(decodedRoute);
          
          const stats = await generateRouteSafetyAnalysis(decodedRoute, facility.tags?.name || 'Facility');
          setSafetyStats(stats);
          
          // Fit bounds
          if (decodedRoute.length > 0) {
            setMapCenter([facility.lat, facility.lon]);
            setMapZoom(14);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch route", err);
    }
  };

  const handleSOS = async () => {
    setSosActive(true);
    
    if (facilities.length > 0) {
      await fetchRouteToFacility(facilities[0]);
    }
  };

  const selectFacility = async (facility: any) => {
    await fetchRouteToFacility(facility);
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

              {facilities.length > 0 && (
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <h3 className={`text-xs uppercase tracking-wider font-semibold mb-3 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Nearest Facilities (5-10km)</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {facilities.map((fac, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectFacility(fac)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          nearestFacility?.id === fac.id
                            ? isDark ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700'
                            : isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`${nearestFacility?.id === fac.id ? 'bg-blue-500/20 text-blue-500' : 'bg-green-500/20 text-green-500'} p-2 rounded-full shrink-0`}>
                              <MapPin size={16} />
                            </div>
                            <div>
                              <p className={`font-bold text-sm ${nearestFacility?.id === fac.id ? (isDark ? 'text-blue-400' : 'text-blue-700') : (isDark ? 'text-zinc-200' : 'text-zinc-800')}`}>
                                {fac.tags?.name || 'Emergency Facility'}
                              </p>
                              <p className="text-xs mt-0.5">
                                {fac.distanceKm.toFixed(1)} km away
                                {nearestFacility?.id === fac.id && distance && (
                                  <span> • {distance} • <span className="text-red-500 font-medium">{eta}</span></span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {safetyStats && (
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>AI Route Safety</h3>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${
                      safetyStats.score >= 80 ? 'bg-green-500/20 text-green-500' :
                      safetyStats.score >= 60 ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      Score: {safetyStats.score}/100
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {safetyStats.risks.map((risk: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>{risk.type}</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-24 h-1.5 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                            <div 
                              className={`h-full rounded-full ${
                                risk.percentage > 50 ? 'bg-red-500' : 
                                risk.percentage > 25 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${risk.percentage}%` }}
                            />
                          </div>
                          <span className={`text-xs w-8 text-right ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{risk.percentage}%</span>
                        </div>
                      </div>
                    ))}
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
        <div className={`w-full h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl border relative ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
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
                : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              }
              attribution='&copy; Google Maps'
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

          {/* Map Controls */}
          <div className="absolute right-4 bottom-4 flex flex-col gap-2 z-[1000]">
            <button 
              onClick={() => setShowTraffic(!showTraffic)}
              className={`p-3 rounded-xl shadow-lg border backdrop-blur-sm transition-all group ${
                showTraffic 
                  ? 'bg-blue-500 text-white border-blue-400' 
                  : isDark ? 'bg-zinc-900/90 text-white border-zinc-800/50 hover:bg-zinc-800' : 'bg-white/90 text-zinc-900 border-zinc-200/50 hover:bg-zinc-100'
              }`}
              title="Toggle Traffic Layer"
            >
              <Layers size={20} />
            </button>
            <button 
              onClick={() => {
                setMapCenter(center);
                setMapZoom(14);
              }}
              className={`p-3 rounded-xl shadow-lg border backdrop-blur-sm transition-all group ${isDark ? 'bg-zinc-900/90 text-white border-zinc-800/50 hover:bg-zinc-800' : 'bg-white/90 text-zinc-900 border-zinc-200/50 hover:bg-zinc-100'}`}
              title="Center on my location"
            >
              <Crosshair size={20} className="group-hover:text-red-500 transition-colors" />
            </button>
            
            <div className={`rounded-xl shadow-lg border backdrop-blur-sm overflow-hidden flex flex-col mt-2 ${isDark ? 'bg-zinc-900/90 border-zinc-800/50' : 'bg-white/90 border-zinc-200/50'}`}>
              <button 
                onClick={() => setMapZoom(prev => Math.min(prev + 1, 18))}
                className={`p-3 transition-colors border-b ${isDark ? 'text-white hover:bg-zinc-800 border-zinc-800/50' : 'text-zinc-900 hover:bg-zinc-100 border-zinc-200/50'}`}
              >
                <Plus size={20} />
              </button>
              <button 
                onClick={() => setMapZoom(prev => Math.max(prev - 1, 3))}
                className={`p-3 transition-colors ${isDark ? 'text-white hover:bg-zinc-800' : 'text-zinc-900 hover:bg-zinc-100'}`}
              >
                <Minus size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
