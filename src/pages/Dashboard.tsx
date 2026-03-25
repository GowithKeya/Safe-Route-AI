import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { AlertTriangle, Navigation, Activity, ShieldAlert, MapPin, Search, Layers, X, Clock, Settings2, Plus, Minus, Crosshair, ChevronLeft, ChevronRight, Home, Sparkles, User } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, CircleMarker, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

    points.push([lat / 1e5, lng / 1e5] as [number, number]);
  }
  return points;
}

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
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  fire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>',
  h: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5v14M16 5v14M8 12h8"/></svg>',
  rx: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 18l-8-8M8 18l8-8M5 4h6a4 4 0 0 1 0 8H5V4z"/></svg>',
  paw: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3.1-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/></svg>',
  car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>',
};

const getVehicleIcon = (type: string) => {
  let innerSvg = svgs.cross;
  let color = '#ef4444';
  if (type === 'fire') {
    innerSvg = svgs.fire;
    color = '#f97316';
  } else if (type === 'police') {
    innerSvg = svgs.shield;
    color = '#3b82f6';
  } else if (type !== 'ambulance') {
    innerSvg = svgs.car;
    color = '#8b5cf6';
  }

  return createGoogleMarker(color, innerSvg, 36);
};

const customHospitalIcon = createGoogleMarker('#ef4444', svgs.h, 32);
const customPharmacyIcon = createGoogleMarker('#10b981', svgs.rx, 28);
const customClinicIcon = createGoogleMarker('#0ea5e9', svgs.cross, 28);
const customVetIcon = createGoogleMarker('#f59e0b', svgs.paw, 28);
const customPoliceIcon = createGoogleMarker('#3b82f6', svgs.shield, 32);
const customAccidentIcon = createGoogleMarker('#eab308', svgs.alert, 32);

const center: [number, number] = [28.6139, 77.2090]; // New Delhi

const socket = io();

// Map Controller Component
function MapController({ center, zoom, bounds }: { center: [number, number], zoom: number, bounds?: L.LatLngBoundsExpression }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.flyTo(center, zoom, {
        animate: true,
        duration: 1.5
      });
    }
  }, [center, zoom, bounds, map]);

  return null;
}

function MapEvents({ reportingIncident, setNewIncidentLocation }: { reportingIncident: boolean, setNewIncidentLocation: (loc: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      if (reportingIncident) {
        setNewIncidentLocation([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [tripProgress, setTripProgress] = useState(0);
  const [vehicles, setVehicles] = useState<Record<string, any>>({});
  const [dynamicETA, setDynamicETA] = useState<string | null>(null);
  const [routeCalculated, setRouteCalculated] = useState(false);
  const [accidents, setAccidents] = useState<any[]>([
    { id: 'acc-1', lat: 28.62, lng: 77.21, desc: 'Accident Reported', time: '2 mins ago' }
  ]);
  const [newIncidentAlert, setNewIncidentAlert] = useState<string | null>(null);
  const [reportingIncident, setReportingIncident] = useState(false);
  const [newIncidentLocation, setNewIncidentLocation] = useState<[number, number] | null>(null);
  const [newIncidentDesc, setNewIncidentDesc] = useState('');
  const [facilities, setFacilities] = useState<any[]>([]);
  const [trafficSegments, setTrafficSegments] = useState<any[]>([]);
  const [isLoadingTraffic, setIsLoadingTraffic] = useState(false);
  const [fleet, setFleet] = useState<any[]>([]);
  const [showTraffic, setShowTraffic] = useState(false);
  const [trafficFilters, setTrafficFilters] = useState({
    clear: true,
    moderate: true,
    heavy: true,
    severe: true
  });
  const [facilityFilters, setFacilityFilters] = useState({
    hospitals: true,
    clinics: true,
    pharmacies: true,
    police: true
  });
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [vehiclePaths, setVehiclePaths] = useState<Record<string, {lat: number, lng: number, timestamp: number}[]>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [followVehicle, setFollowVehicle] = useState(false);
  const [pathHistoryDuration, setPathHistoryDuration] = useState<number>(5); // in minutes
  
  // Route Preferences
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [routePreference, setRoutePreference] = useState<'fastest' | 'shortest'>('fastest');
  const [showPreferences, setShowPreferences] = useState(false);
  const [mapZoom, setMapZoom] = useState(12);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapBounds, setMapBounds] = useState<L.LatLngBoundsExpression | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);

  const [incidentRoute, setIncidentRoute] = useState<[number, number][] | null>(null);
  const [incidentVehicle, setIncidentVehicle] = useState<any | null>(null);
  const [activeDispatch, setActiveDispatch] = useState<{ vehicleId: string, destination: [number, number], notified: boolean } | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'info' | 'warning' | 'success' } | null>(null);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Check if dispatched vehicle is nearing destination
  useEffect(() => {
    if (activeDispatch && !activeDispatch.notified) {
      const vehicle = fleet.find(v => v.id === activeDispatch.vehicleId);
      if (vehicle) {
        const dist = Math.sqrt(Math.pow(vehicle.lat - activeDispatch.destination[0], 2) + Math.pow(vehicle.lng - activeDispatch.destination[1], 2));
        // Roughly 500 meters (0.005 degrees)
        if (dist < 0.005) {
          setNotification({
            message: `Unit ${vehicle.id} is arriving at the incident scene.`,
            type: 'warning'
          });
          setActiveDispatch(prev => prev ? { ...prev, notified: true } : null);
        }
      }
    }
  }, [fleet, activeDispatch]);

  // Dynamic ETA calculation for active dispatch
  useEffect(() => {
    if (activeDispatch) {
      const vehicle = fleet.find(v => v.id === activeDispatch.vehicleId);
      if (vehicle) {
        // Calculate distance in km using Haversine formula
        const R = 6371;
        const dLat = (activeDispatch.destination[0] - vehicle.lat) * (Math.PI/180);
        const dLon = (activeDispatch.destination[1] - vehicle.lng) * (Math.PI/180); 
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(vehicle.lat * (Math.PI/180)) * Math.cos(activeDispatch.destination[0] * (Math.PI/180)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const distance = R * c;
        
        // Use vehicle speed or default to 40 km/h
        const speed = vehicle.speed > 0 ? vehicle.speed : 40;
        
        let timeHours = distance / speed;
        
        // Traffic multiplier
        if (showTraffic) {
          timeHours *= 1.2;
        }
        
        const timeMins = Math.max(1, Math.ceil(timeHours * 60));
        setDynamicETA(`${timeMins} mins`);
      }
    }
  }, [fleet, activeDispatch, showTraffic]);

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

  const activeVehicle = selectedVehicle ? (fleet.find(v => v.id === selectedVehicle.id) || vehicles[selectedVehicle.id] || selectedVehicle) : null;

  const handleDispatchNearest = async (acc: [number, number]) => {
    let nearest: any = null;
    let minDistance = Infinity;
    
    // Check fleet
    fleet.forEach(v => {
      const dist = Math.sqrt(Math.pow(v.lat - acc[0], 2) + Math.pow(v.lng - acc[1], 2));
      if (dist < minDistance) {
        minDistance = dist;
        nearest = v;
      }
    });

    if (nearest) {
      setIncidentVehicle(nearest);
      setActiveDispatch({ vehicleId: nearest.id, destination: acc, notified: false });
      setNotification({ message: `Dispatching ${nearest.id} to incident.`, type: 'info' });
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${nearest.lng},${nearest.lat};${acc[1]},${acc[0]}?overview=full&geometries=polyline`);
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const decoded = decodePolyline(data.routes[0].geometry);
          setIncidentRoute(decoded);
          setMapBounds([
            [nearest.lat, nearest.lng],
            acc
          ]);
        }
      } catch (e) {
        console.error("Failed to calculate incident route", e);
        setIncidentRoute([
          [nearest.lat, nearest.lng],
          acc
        ]);
      }
    }
  };

  const handleCalculateRouteToVehicle = async (v: any) => {
    const origin = mapCenter;
    const dest = [v.lat, v.lng] as [number, number];
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${dest[1]},${dest[0]}?overview=full&geometries=polyline`);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const decoded = decodePolyline(data.routes[0].geometry);
        setIncidentRoute(decoded);
        setMapBounds([
          origin,
          dest
        ]);
      }
    } catch (e) {
      console.error("Failed to calculate route to vehicle", e);
      setIncidentRoute([
        origin,
        dest
      ]);
    }
  };

  useEffect(() => {
    if (followVehicle && activeVehicle) {
      setMapCenter([activeVehicle.lat, activeVehicle.lng]);
    }
  }, [activeVehicle, followVehicle]);

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
          node["amenity"="police"](around:3000,${center[0]},${center[1]});
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
        setFacilities(data.elements || []);
      } catch (e) {
        console.warn("Failed to fetch facilities, using static fallbacks.", e);
      }
    };

    fetchFacilities();

    return () => {
      socket.off('vehicleLocationUpdate');
      socket.off('fleetUpdate');
    };
  }, []);

  // Fetch and generate AI traffic prediction
  useEffect(() => {
    if (showTraffic && trafficSegments.length === 0) {
      const fetchTraffic = async () => {
        setIsLoadingTraffic(true);
        const query = `
          [out:json][timeout:10];
          (
            way["highway"~"primary|secondary|trunk"](around:4000,${center[0]},${center[1]});
          );
          out geom;
        `;
        try {
          const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
          const data = await res.json();
          
          const segments = data.elements
            .filter((e: any) => e.type === 'way' && e.geometry)
            .map((way: any) => {
              // AI prediction simulation based on way ID to be deterministic
              const seed = way.id % 100;
              let level = 'clear';
              let color = '#22c55e'; // green
              
              if (seed > 95) {
                level = 'severe';
                color = '#7f1d1d'; // dark red
              } else if (seed > 80) { 
                level = 'heavy'; 
                color = '#ef4444'; // red
              } else if (seed > 40) { 
                level = 'moderate'; 
                color = '#eab308'; // yellow
              }

              return {
                id: way.id,
                positions: way.geometry.map((g: any) => [g.lat, g.lon]),
                level,
                color
              };
            });
            
          setTrafficSegments(segments);
        } catch (e) {
          console.error("Failed to fetch traffic data", e);
        } finally {
          setIsLoadingTraffic(false);
        }
      };

      fetchTraffic();
    }
  }, [showTraffic, trafficSegments.length]);

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
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden relative">
      {/* Notification Toast */}
      {notification && (
        <div className={`absolute top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 ${
          notification.type === 'warning' ? 'bg-red-500/20 border-red-500/50 text-red-100' :
          notification.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-100' :
          'bg-blue-500/20 border-blue-500/50 text-blue-100'
        }`}>
          {notification.type === 'warning' && <AlertTriangle size={20} className="text-red-400" />}
          {notification.type === 'info' && <Activity size={20} className="text-blue-400" />}
          <span className="font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 text-zinc-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => navigate(-1)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-300 transition-colors" title="Go Back">
              <ChevronLeft size={16} />
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => navigate('/profile')} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-300 transition-colors" title="Profile">
                <User size={16} />
              </button>
              <button onClick={() => navigate('/')} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-300 transition-colors" title="Go Home">
                <Home size={16} />
              </button>
            </div>
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
                <div className="space-y-2">
                  <button 
                    onClick={() => setShowTraffic(!showTraffic)}
                    className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                      showTraffic 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                    }`}
                  >
                    {isLoadingTraffic && showTraffic ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Layers size={18} />
                    )}
                    {showTraffic ? (isLoadingTraffic ? 'Loading AI Traffic...' : 'Hide Live Traffic') : 'Show Live Traffic'}
                  </button>
                  
                  {showTraffic && (
                    <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800 space-y-2">
                      <div className="text-xs font-medium text-zinc-400 mb-2">Traffic Filters</div>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={trafficFilters.clear} 
                            onChange={(e) => setTrafficFilters({...trafficFilters, clear: e.target.checked})}
                            className="rounded border-zinc-700 bg-zinc-800 text-green-500 focus:ring-green-500"
                          />
                          <span className="w-2 h-2 rounded-full bg-green-500"></span> Clear
                        </label>
                        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={trafficFilters.moderate} 
                            onChange={(e) => setTrafficFilters({...trafficFilters, moderate: e.target.checked})}
                            className="rounded border-zinc-700 bg-zinc-800 text-yellow-500 focus:ring-yellow-500"
                          />
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Moderate
                        </label>
                        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={trafficFilters.heavy} 
                            onChange={(e) => setTrafficFilters({...trafficFilters, heavy: e.target.checked})}
                            className="rounded border-zinc-700 bg-zinc-800 text-red-500 focus:ring-red-500"
                          />
                          <span className="w-2 h-2 rounded-full bg-red-500"></span> Heavy
                        </label>
                        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={trafficFilters.severe} 
                            onChange={(e) => setTrafficFilters({...trafficFilters, severe: e.target.checked})}
                            className="rounded border-zinc-700 bg-zinc-800 text-red-900 focus:ring-red-900"
                          />
                          <span className="w-2 h-2 rounded-full bg-red-900"></span> Severe
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
                  <div className="text-sm text-zinc-400 flex items-center gap-2 mb-3">
                    <Layers size={14} /> Facility Filters
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={facilityFilters.hospitals} 
                        onChange={(e) => setFacilityFilters({...facilityFilters, hospitals: e.target.checked})}
                        className="rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                      />
                      Hospitals
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={facilityFilters.clinics} 
                        onChange={(e) => setFacilityFilters({...facilityFilters, clinics: e.target.checked})}
                        className="rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                      />
                      Clinics
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={facilityFilters.pharmacies} 
                        onChange={(e) => setFacilityFilters({...facilityFilters, pharmacies: e.target.checked})}
                        className="rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                      />
                      Pharmacies
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={facilityFilters.police} 
                        onChange={(e) => setFacilityFilters({...facilityFilters, police: e.target.checked})}
                        className="rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                      />
                      Police
                    </label>
                  </div>
                </div>
                
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
                    {activeDispatch ? dynamicETA : (dynamicETA 
                      ? (emergencyMode ? `${Math.max(1, Math.floor(parseInt(dynamicETA) * (1 - tripProgress/100)))} mins` : dynamicETA) 
                      : (emergencyMode ? `${Math.max(1, Math.floor(12 * (1 - tripProgress/100)))} mins` : '12 mins'))}
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Reported Incidents</h3>
                <button 
                  onClick={() => setReportingIncident(true)}
                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-300 transition-colors"
                  title="Report New Incident"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="space-y-2">
                {accidents.map((acc, i) => (
                  <div key={acc.id || i} className={`border rounded-lg p-3 flex flex-col gap-2 transition-all duration-1000 ${newIncidentAlert === acc.id ? 'bg-red-500/30 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-red-500/10 border-red-500/20'}`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-red-500 shrink-0" size={18} />
                      <div>
                        <p className="text-sm font-medium text-red-200">{acc.desc}</p>
                        <p className="text-xs text-red-400/70">{acc.time}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDispatchNearest([acc.lat, acc.lng])}
                      className="mt-1 w-full py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded transition-colors border border-red-500/30"
                    >
                      Dispatch Nearest Unit
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Active Fleet</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {fleet.map((v) => {
                  const hasAlert = v.status === 'Investigating Scene' || v.status === 'Responding to Fire' || v.status === 'En Route to Incident';
                  return (
                    <div 
                      key={v.id} 
                      onClick={() => setSelectedVehicle(v)}
                      className={`bg-zinc-950 border ${hasAlert ? 'border-red-500/80 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-zinc-800'} rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-900 transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full ${
                          v.type === 'ambulance' ? 'bg-red-500/20 text-red-500' :
                          v.type === 'fire' ? 'bg-orange-500/20 text-orange-500' :
                          v.type === 'police' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-zinc-500/20 text-zinc-500'
                        }`}>
                          <Activity size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white">{v.id}</p>
                            {hasAlert && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                          </div>
                          <p className={`text-xs ${hasAlert ? 'text-red-400 font-medium' : 'text-zinc-400'}`}>{v.status}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-600" />
                    </div>
                  );
                })}
              </div>
            </div>

            {activeVehicle && (
              <div className="mt-6 border-t border-zinc-800 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Unit Details</h3>
                  <button 
                    onClick={() => {
                      setSelectedVehicle(null);
                      setFollowVehicle(false);
                    }}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800 space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/50">
                    <div className={`p-2 rounded-full ${
                      activeVehicle.type === 'ambulance' || activeVehicle.id === 'AMB-101' ? 'bg-red-500/20 text-red-500' :
                      activeVehicle.type === 'fire' ? 'bg-orange-500/20 text-orange-500' :
                      activeVehicle.type === 'police' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-zinc-500/20 text-zinc-500'
                    }`}>
                      <Activity size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-none">{activeVehicle.id}</p>
                      <p className="text-xs text-zinc-400 capitalize mt-1">{activeVehicle.type || 'Emergency Unit'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">Status</span>
                      <span className={`text-sm font-medium ${
                        activeVehicle.status?.includes('Responding') || activeVehicle.status?.includes('En Route') || emergencyMode && activeVehicle.id === 'AMB-101'
                          ? 'text-red-400' 
                          : activeVehicle.status === 'Investigating Scene'
                            ? 'text-orange-400 animate-pulse'
                            : activeVehicle.status === 'Patrolling'
                              ? 'text-blue-400'
                              : 'text-green-400'
                      }`}>
                        {activeVehicle.id === 'AMB-101' ? (emergencyMode ? 'Emergency Priority' : 'Standby') : activeVehicle.status || 'Active'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">Coordinates</span>
                      <span className="font-mono text-xs text-zinc-300">
                        {activeVehicle.lat.toFixed(4)}, {activeVehicle.lng.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">Speed</span>
                      <span className="font-mono text-xs text-zinc-300">
                        {activeVehicle.speed ? `${Math.round(activeVehicle.speed)} km/h` : (activeVehicle.status?.includes('Responding') || activeVehicle.status?.includes('En Route') ? '65 km/h' : '0 km/h')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-zinc-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-300">Follow Vehicle</span>
                      <button 
                        onClick={() => setFollowVehicle(!followVehicle)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${followVehicle ? 'bg-blue-500' : 'bg-zinc-700'}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${followVehicle ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
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

      {/* Reporting UI Overlay */}
      {reportingIncident && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl w-96">
          <h3 className="text-white font-medium mb-2">Report New Incident</h3>
          {!newIncidentLocation ? (
            <p className="text-sm text-zinc-400 mb-4">Click anywhere on the map to select the location.</p>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-zinc-500">Location selected: {newIncidentLocation[0].toFixed(4)}, {newIncidentLocation[1].toFixed(4)}</div>
              <input 
                type="text" 
                placeholder="Brief description (e.g., Accident, Road Block)" 
                value={newIncidentDesc}
                onChange={e => setNewIncidentDesc(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (newIncidentLocation && newIncidentDesc) {
                      const newAccId = `acc-${Date.now()}`;
                      setAccidents([{ id: newAccId, lat: newIncidentLocation[0], lng: newIncidentLocation[1], desc: newIncidentDesc, time: 'Just now' }, ...accidents]);
                      setNotification({ message: `Incident reported: ${newIncidentDesc}`, type: 'success' });
                      setNewIncidentAlert(newAccId);
                      setTimeout(() => setNewIncidentAlert(null), 5000);
                      setReportingIncident(false);
                      setNewIncidentLocation(null);
                      setNewIncidentDesc('');
                    }
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium transition-colors"
                >
                  Submit Report
                </button>
                <button 
                  onClick={() => {
                    setReportingIncident(false);
                    setNewIncidentLocation(null);
                    setNewIncidentDesc('');
                  }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Map Area */}
      <div className="flex-1 relative z-0">
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ width: '100%', height: '100%', cursor: reportingIncident ? 'crosshair' : 'grab' }}
          zoomControl={false}
        >
          <MapController center={mapCenter} zoom={mapZoom} bounds={mapBounds} />
          <MapEvents reportingIncident={reportingIncident} setNewIncidentLocation={setNewIncidentLocation} />
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            attribution='&copy; Google Maps'
          />

          {/* AI Traffic Prediction Overlay */}
          {showTraffic && trafficSegments
            .filter(seg => trafficFilters[seg.level as keyof typeof trafficFilters])
            .map(seg => (
            <Polyline
              key={`traffic-${seg.id}`}
              positions={seg.positions}
              color={seg.color}
              weight={4}
              opacity={0.6}
            />
          ))}

          {/* Vehicle Paths */}
          {showHistory && activeVehicle && vehiclePaths[activeVehicle.id] && (
            (() => {
              const path = vehiclePaths[activeVehicle.id];
              let color = '#ef4444'; // default ambulance red
              if (activeVehicle?.type === 'fire') color = '#f97316';
              else if (activeVehicle?.type === 'police') color = '#3b82f6';

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
            icon={getVehicleIcon('ambulance')}
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
          {facilities.filter(fac => {
            if (fac.tags?.amenity === 'hospital') return facilityFilters.hospitals;
            if (fac.tags?.amenity === 'clinic' || fac.tags?.amenity === 'doctors') return facilityFilters.clinics;
            if (fac.tags?.amenity === 'pharmacy') return facilityFilters.pharmacies;
            if (fac.tags?.amenity === 'police') return facilityFilters.police;
            return true;
          }).map((fac, i) => {
            let icon = customHospitalIcon;
            let typeName = "Hospital";
            if (fac.tags?.amenity === 'pharmacy') { icon = customPharmacyIcon; typeName = "Pharmacy"; }
            else if (fac.tags?.amenity === 'clinic' || fac.tags?.amenity === 'doctors') { icon = customClinicIcon; typeName = "Clinic/Doctor"; }
            else if (fac.tags?.amenity === 'veterinary') { icon = customVetIcon; typeName = "Veterinary"; }
            else if (fac.tags?.amenity === 'police') { icon = customPoliceIcon; typeName = "Police Station"; }

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
          {facilityFilters.hospitals && hospitals.map((hospital, i) => (
            <Marker key={`h-${i}`} position={hospital.pos} icon={customHospitalIcon}>
              <Popup>
                <div className="text-zinc-900 font-medium">{hospital.name}</div>
                <div className="text-zinc-500 text-sm">Hospital</div>
              </Popup>
            </Marker>
          ))}

          {/* Simulated Fleet Vehicles */}
          {fleet.map((v) => {
            const hasAlert = v.status === 'Investigating Scene' || v.status === 'Responding to Fire' || v.status === 'En Route to Incident';
            return (
              <React.Fragment key={v.id}>
                {hasAlert && (
                  <CircleMarker 
                    center={[v.lat, v.lng]} 
                    radius={20} 
                    color="#ef4444" 
                    fillColor="#ef4444" 
                    fillOpacity={0.2} 
                    className="animate-ping" 
                  />
                )}
                <Marker 
                  position={[v.lat, v.lng]} 
                  icon={getVehicleIcon(v.type)}
                  eventHandlers={{
                    click: () => setSelectedVehicle(v),
                  }}
                >
                  <Popup>
                    <div className="text-zinc-900 font-bold mb-1 flex items-center gap-1">
                      {v.id}
                      {hasAlert && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                    </div>
                    <div className="text-zinc-600 text-xs mb-1">
                      <span className="font-semibold text-zinc-800">Type:</span> {v.type.toUpperCase()}
                    </div>
                    <div className="text-zinc-600 text-xs mb-1 flex items-center gap-1">
                    <span className="font-semibold text-zinc-800">Status:</span> 
                    <span className={`px-1.5 py-0.5 rounded-sm font-medium ${
                      v.status === 'Investigating Scene' ? 'bg-orange-100 text-orange-700 animate-pulse' :
                      v.status === 'Responding to Fire' ? 'bg-red-100 text-red-700' :
                      v.status === 'En Route to Incident' ? 'bg-red-100 text-red-700' :
                      v.status === 'Patrolling' ? 'bg-blue-100 text-blue-700' :
                      'bg-zinc-100 text-zinc-700'
                    }`}>
                      {v.status}
                    </span>
                  </div>
                  <div className="text-zinc-600 text-xs mb-1">
                    <span className="font-semibold text-zinc-800">Speed:</span> {v.speed ? `${Math.round(v.speed)} km/h` : '0 km/h'}
                  </div>
                  <div className="text-zinc-600 text-xs mb-2">
                    <span className="font-semibold text-zinc-800">Location:</span> {v.lat.toFixed(4)}, {v.lng.toFixed(4)}
                  </div>
                  <button 
                    onClick={() => handleCalculateRouteToVehicle(v)}
                    className="w-full py-1.5 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors"
                  >
                    Calculate Route to Vehicle
                  </button>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

          {/* Other User Vehicles */}
          {Object.values(vehicles).map((v: any) => (
            <Marker 
              key={v.id} 
              position={[v.lat, v.lng]} 
              icon={getVehicleIcon(v.type || 'ambulance')}
              eventHandlers={{
                click: () => setSelectedVehicle({ ...v, type: v.type || 'user vehicle', status: 'Active' }),
              }}
            >
              <Popup>
                <div className="text-zinc-900 font-medium">{v.id}</div>
                <div className="text-zinc-500 text-sm mb-2">User Vehicle</div>
                <button 
                  onClick={() => handleCalculateRouteToVehicle(v)}
                  className="w-full py-1.5 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors"
                >
                  Calculate Route to Vehicle
                </button>
              </Popup>
            </Marker>
          ))}

          {/* Accidents */}
          {accidents.map((acc, i) => (
            <React.Fragment key={`acc-${acc.id || i}`}>
              {newIncidentAlert === acc.id && (
                <CircleMarker
                  center={[acc.lat, acc.lng]}
                  radius={40}
                  pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2, weight: 2 }}
                  className="animate-ping"
                />
              )}
              <Marker position={[acc.lat, acc.lng]} icon={customAccidentIcon}>
                <Popup>
                  <div className="text-red-600 font-medium mb-2">{acc.desc}</div>
                  <button 
                    onClick={() => handleDispatchNearest([acc.lat, acc.lng])}
                    className="w-full py-1.5 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 transition-colors"
                  >
                    Dispatch Nearest Unit
                  </button>
                </Popup>
              </Marker>
            </React.Fragment>
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

          {/* Incident Route */}
          {incidentRoute && (
            <Polyline 
              positions={incidentRoute} 
              color="#f59e0b" 
              weight={5} 
              opacity={0.8}
              dashArray="10, 10"
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
