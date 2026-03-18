import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from 'react-leaflet';
import { MapPin, Navigation, ShieldAlert, AlertTriangle, ShieldCheck, Clock, Layers, Crosshair, Plus, Minus, ChevronLeft, Home, Search, Activity, Sparkles, Save, Bookmark, Trash2, X, List, Share2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLoadScript } from '@react-google-maps/api';

const libraries: ("places")[] = ["places"];

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

const customOriginIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>'),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const customDestIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const customHazardIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>'),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Map Controller Component
function MapController({ center, zoom, bounds }: { center: [number, number], zoom: number, bounds?: L.LatLngBoundsExpression }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 });
    } else {
      map.flyTo(center, zoom, { animate: true, duration: 1.5 });
    }
  }, [center, zoom, bounds, map]);

  return null;
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

const defaultCenter: [number, number] = [28.6139, 77.2090]; // New Delhi

const socket = io();

export default function SafeRoute() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const navigate = useNavigate();
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [mapZoom, setMapZoom] = useState(12);
  const [mapBounds, setMapBounds] = useState<L.LatLngBoundsExpression | undefined>(undefined);
  const [showTraffic, setShowTraffic] = useState(false);
  const [historicalDate, setHistoricalDate] = useState<string>('');
  const [historicalTime, setHistoricalTime] = useState<string>('');
  const [showHistoricalTraffic, setShowHistoricalTraffic] = useState(false);
  
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [originResults, setOriginResults] = useState<any[]>([]);
  const [destResults, setDestResults] = useState<any[]>([]);
  
  const [origin, setOrigin] = useState<any | null>(null);
  const [destination, setDestination] = useState<any | null>(null);
  
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [directions, setDirections] = useState<any[]>([]);
  const [showDirections, setShowDirections] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hoveredHotspot, setHoveredHotspot] = useState<any | null>(null);
  
  const [safetyStats, setSafetyStats] = useState<any | null>(null);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [localPOIs, setLocalPOIs] = useState<any[]>([]);
  const [fleet, setFleet] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Record<string, any>>({});
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);

  // Load saved routes on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedSafeRoutes');
    if (saved) {
      try {
        setSavedRoutes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved routes", e);
      }
    }
  }, []);

  const isRouteSaved = savedRoutes.some(r => 
    r.origin?.name === origin?.name && 
    r.destination?.name === destination?.name
  );

  const handleSaveRoute = () => {
    if (!origin || !destination || !route || !safetyStats || isRouteSaved) return;
    
    const defaultName = `${origin.name} to ${destination.name}`;
    const customName = window.prompt("Enter a name for this saved route:", defaultName);
    
    if (customName === null) return; // User cancelled
    
    const newRoute = {
      id: Date.now().toString(),
      name: customName.trim() || defaultName,
      origin,
      destination,
      route,
      safetyStats,
      eta,
      distance,
      directions,
      facilities,
      timestamp: Date.now()
    };
    const updated = [newRoute, ...savedRoutes];
    setSavedRoutes(updated);
    localStorage.setItem('savedSafeRoutes', JSON.stringify(updated));
  };

  const [shareCopied, setShareCopied] = useState(false);
  const handleShareRoute = () => {
    if (!origin || !destination) return;
    const url = new URL(window.location.href);
    url.searchParams.set('originLat', origin.lat.toString());
    url.searchParams.set('originLng', origin.lng.toString());
    url.searchParams.set('originName', origin.name);
    url.searchParams.set('destLat', destination.lat.toString());
    url.searchParams.set('destLng', destination.lng.toString());
    url.searchParams.set('destName', destination.name);
    
    navigator.clipboard.writeText(url.toString()).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy share link: ', err);
    });
  };

  const handleLoadRoute = (savedRoute: any) => {
    setOrigin(savedRoute.origin);
    setOriginQuery(savedRoute.origin.name);
    setDestination(savedRoute.destination);
    setDestQuery(savedRoute.destination.name);
    setRoute(savedRoute.route);
    setSafetyStats(savedRoute.safetyStats);
    setEta(savedRoute.eta);
    setDistance(savedRoute.distance);
    setDirections(savedRoute.directions || []);
    setFacilities(savedRoute.facilities || []);
    setMapBounds([
      [savedRoute.origin.lat, savedRoute.origin.lng],
      [savedRoute.destination.lat, savedRoute.destination.lng]
    ]);
  };

  const handleDeleteRoute = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedRoutes.filter(r => r.id !== id);
    setSavedRoutes(updated);
    localStorage.setItem('savedSafeRoutes', JSON.stringify(updated));
  };

  // Fetch initial POIs around default center for quick suggestions
  useEffect(() => {
    const fetchInitialPOIs = async () => {
      const query = `
        [out:json];
        (
          node["amenity"="hospital"](around:10000,${defaultCenter[0]},${defaultCenter[1]});
          node["amenity"="police"](around:10000,${defaultCenter[0]},${defaultCenter[1]});
          node["amenity"="pharmacy"](around:10000,${defaultCenter[0]},${defaultCenter[1]});
        );
        out body;
      `;
      try {
        const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const data = await res.json();
        setLocalPOIs(data.elements || []);
      } catch (e) {
        console.error("Failed to fetch initial POIs", e);
      }
    };
    fetchInitialPOIs();
  }, []);

  // Socket for vehicle tracking
  useEffect(() => {
    socket.on('vehicleLocationUpdate', (data) => {
      setVehicles(prev => ({ ...prev, [data.id]: data }));
    });
    socket.on('fleetUpdate', (data) => {
      setFleet(data);
    });
    return () => {
      socket.off('vehicleLocationUpdate');
      socket.off('fleetUpdate');
    };
  }, []);

  // AI Search with Google Maps Places & Local POIs
  const searchLocation = async (query: string, setResults: any) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    
    const qLower = query.toLowerCase();
    const results: any[] = [];

    // 1. Search local POIs (Hospitals, Police, etc.)
    localPOIs.forEach(f => {
      const name = f.tags?.name || '';
      if (name.toLowerCase().includes(qLower)) {
        let typeName = "Safe Zone";
        if (f.tags?.amenity === 'hospital') typeName = "Hospital";
        else if (f.tags?.amenity === 'police') typeName = "Police Station";
        else if (f.tags?.amenity === 'pharmacy') typeName = "Pharmacy";

        if (!results.some(r => r.name === name)) {
          // Deterministic mock traffic based on ID
          const trafficLevels = ['Light', 'Moderate', 'Heavy'];
          const traffic = trafficLevels[f.id % 3];
          
          results.push({
            id: f.id,
            name: name,
            fullName: `${typeName} • Traffic: ${traffic}`,
            type: typeName,
            traffic: traffic,
            isSafeZone: true,
            lat: f.lat,
            lng: f.lon
          });
        }
      }
    });

    // 2. Google Maps Places Search
    if (results.length < 5 && isLoaded && window.google) {
      try {
        const autocompleteService = new window.google.maps.places.AutocompleteService();
        const predictions = await new Promise<any[]>((resolve) => {
          autocompleteService.getPlacePredictions({ input: query }, (preds, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && preds) {
              resolve(preds);
            } else {
              resolve([]);
            }
          });
        });
        
        predictions.forEach((p) => {
          if (!results.some(r => r.name === p.structured_formatting.main_text)) {
            const trafficLevels = ['Light', 'Moderate', 'Heavy'];
            const traffic = trafficLevels[Math.floor(Math.random() * 3)];
            results.push({
              id: `gmap-${p.place_id}`,
              name: p.structured_formatting.main_text,
              fullName: p.description,
              type: 'Location',
              traffic: traffic,
              isSafeZone: false,
              placeId: p.place_id,
            });
          }
        });
      } catch (e) {
        console.error("Google Maps Search failed", e);
      }
    } else if (results.length < 5) {
      // Fallback to Nominatim
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        data.forEach((item: any) => {
          const name = item.display_name.split(',')[0];
          if (!results.some(r => r.name === name)) {
            const trafficLevels = ['Light', 'Moderate', 'Heavy'];
            const traffic = trafficLevels[Math.floor(Math.random() * 3)];
            results.push({
              id: `nom-${item.place_id}`,
              name: name,
              fullName: item.display_name,
              type: 'Location',
              traffic: traffic,
              isSafeZone: false,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            });
          }
        });
      } catch (e) {
        console.error("Nominatim Search failed", e);
      }
    }
    
    setResults(results.slice(0, 6));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (originQuery && !origin) searchLocation(originQuery, setOriginResults);
    }, 500);
    return () => clearTimeout(timer);
  }, [originQuery, origin]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (destQuery && !destination) searchLocation(destQuery, setDestResults);
    }, 500);
    return () => clearTimeout(timer);
  }, [destQuery, destination]);

  const generateRouteSafetyAnalysis = (routePoints: [number, number][], destName: string) => {
    // Mock safety generation based on name length to be deterministic
    const seed = destName.length;
    const isSafe = seed % 3 !== 0; // 66% chance of being "Safe"
    const score = isSafe ? 75 + (seed % 20) : 40 + (seed % 30);
    
    // Generate some mock hotspots along the route
    const hotspots = [];
    if (routePoints.length > 10) {
      const numHotspots = isSafe ? 1 : 3;
      for (let i = 0; i < numHotspots; i++) {
        // Pick a point roughly evenly spaced
        const index = Math.floor((routePoints.length / (numHotspots + 1)) * (i + 1));
        const point = routePoints[index];
        if (point) {
          hotspots.push({
            id: `hotspot-${i}`,
            lat: point[0],
            lng: point[1],
            type: ['Poor Lighting', 'High Crime Area', 'Accident Prone Zone'][Math.floor(Math.random() * 3)],
            severity: ['Medium', 'High'][Math.floor(Math.random() * 2)],
            description: ['Multiple incidents reported in the last 30 days.', 'Area known for low visibility at night.', 'Recent spike in petty theft reports.', 'Frequent traffic collisions at this intersection.'][Math.floor(Math.random() * 4)]
          });
        }
      }
    }

    return {
      isSafe,
      score,
      trafficCondition: ['Light', 'Moderate', 'Heavy'][Math.floor(Math.random() * 3)],
      crimes: [
        { type: "Theft/Pickpocketing", percent: 45 + (seed % 10) },
        { type: "Vandalism", percent: 25 + (seed % 15) },
        { type: "Assault", percent: isSafe ? 5 + (seed % 5) : 20 + (seed % 10) },
        { type: "Vehicle Theft", percent: 15 + (seed % 8) }
      ],
      hotspots
    };
  };

  const fetchFacilitiesAlongRoute = async (routePoints: [number, number][]) => {
    if (routePoints.length === 0) return;
    
    // Calculate bounding box of the route
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    routePoints.forEach(p => {
      if (p[0] < minLat) minLat = p[0];
      if (p[0] > maxLat) maxLat = p[0];
      if (p[1] < minLng) minLng = p[1];
      if (p[1] > maxLng) maxLng = p[1];
    });

    // Add some padding
    minLat -= 0.01; maxLat += 0.01;
    minLng -= 0.01; maxLng += 0.01;

    const query = `
      [out:json];
      (
        node["amenity"="police"](${minLat},${minLng},${maxLat},${maxLng});
        node["amenity"="hospital"](${minLat},${minLng},${maxLat},${maxLng});
        node["amenity"="pharmacy"](${minLat},${minLng},${maxLat},${maxLng});
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

  useEffect(() => {
    const url = new URL(window.location.href);
    const originLat = url.searchParams.get('originLat');
    const originLng = url.searchParams.get('originLng');
    const originName = url.searchParams.get('originName');
    const destLat = url.searchParams.get('destLat');
    const destLng = url.searchParams.get('destLng');
    const destName = url.searchParams.get('destName');

    if (originLat && originLng && originName && destLat && destLng && destName) {
      const o = { lat: parseFloat(originLat), lng: parseFloat(originLng), name: originName };
      const d = { lat: parseFloat(destLat), lng: parseFloat(destLng), name: destName };
      setOrigin(o);
      setOriginQuery(originName);
      setDestination(d);
      setDestQuery(destName);
      
      calculateSafeRouteWithArgs(o, d);
    }
  }, []);

  const calculateSafeRouteWithArgs = async (o: any, d: any) => {
    if (!o || !d) return;
    
    setIsCalculating(true);
    
    try {
      const res = await fetch(`/api/directions?origin=${o.lat},${o.lng}&destination=${d.lat},${d.lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const leg = data.routes[0].legs[0];
          const etaText = leg.duration_in_traffic ? leg.duration_in_traffic.text : leg.duration?.text;
          setEta(etaText);
          setDistance(leg.distance?.text);
          setDirections(leg.steps || []);
          
          const encoded = data.routes[0].overview_polyline.points;
          const decodedRoute = decodePolyline(encoded) as [number, number][];
          setRoute(decodedRoute);
          
          setSafetyStats(generateRouteSafetyAnalysis(decodedRoute, d.name));
          
          // Set bounds to fit the route
          setMapBounds([
            [o.lat, o.lng],
            [d.lat, d.lng]
          ]);
          
          // Fetch emergency services along the route
          fetchFacilitiesAlongRoute(decodedRoute);
        }
      }
    } catch (err) {
      console.error("Failed to fetch route", err);
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateSafeRoute = async () => {
    return calculateSafeRouteWithArgs(origin, destination);
  };

  // Generate colored route segments based on historical traffic
  const getHistoricalTrafficSegments = () => {
    if (!route || route.length === 0) return [];
    
    // Use date/time to seed the pseudo-random traffic generation
    const seedStr = historicalDate + historicalTime;
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
      seed += seedStr.charCodeAt(i);
    }
    seed = seed || 1;

    const segments: { positions: [number, number][], color: string }[] = [];
    let currentSegment: [number, number][] = [];
    let currentColor = '#3b82f6'; // Default blue

    route.forEach((point, i) => {
      // Deterministic pseudo-random traffic score (0 to 1)
      const trafficScore = Math.abs(Math.sin((i + seed) * 0.1));
      
      let pointColor = '#3b82f6'; // Clear (Blue)
      if (trafficScore > 0.85) pointColor = '#ef4444'; // Heavy (Red)
      else if (trafficScore > 0.6) pointColor = '#f59e0b'; // Moderate (Orange)
      else if (trafficScore > 0.4) pointColor = '#eab308'; // Light (Yellow)

      if (pointColor !== currentColor && currentSegment.length > 0) {
        currentSegment.push(point); // Connect the segments
        segments.push({ positions: currentSegment, color: currentColor });
        currentSegment = [point];
        currentColor = pointColor;
      } else {
        currentSegment.push(point);
      }
    });

    if (currentSegment.length > 0) {
      segments.push({ positions: currentSegment, color: currentColor });
    }

    return segments;
  };

  // Generate colored route segments based on safety hotspots with gradient overlay
  const getColoredRouteSegments = () => {
    if (!route || route.length === 0) return [];
    if (!safetyStats || !safetyStats.hotspots || safetyStats.hotspots.length === 0) {
      return [{ positions: route, color: '#3b82f6' }]; // Default blue
    }

    // Base score from overall safety stats (0 to 1)
    const baseScore = Math.max(0, Math.min(1, safetyStats.score / 100));

    // Calculate a continuous safety score for each point
    const pointScores = route.map(point => {
      let pointScore = baseScore;
      
      safetyStats.hotspots.forEach((hotspot: any) => {
        // Rough distance calculation (Euclidean distance on lat/lng)
        const dist = Math.sqrt(Math.pow(point[0] - hotspot.lat, 2) + Math.pow(point[1] - hotspot.lng, 2));
        const radius = 0.01; // roughly 1km influence radius
        
        if (dist < radius) {
          // Closer to hotspot = lower score (intensity from 0 to 1)
          const intensity = 1 - (dist / radius);
          // High severity hotspots have a stronger negative impact
          const severityFactor = hotspot.severity === 'High' ? 0.8 : 0.4;
          pointScore -= (intensity * severityFactor);
        }
      });
      
      return Math.max(0, Math.min(1, pointScore));
    });

    // Helper to get color from score (Red -> Yellow -> Emerald)
    const getColor = (score: number) => {
      if (score < 0.5) {
        // Interpolate between Red (#ef4444) and Yellow (#eab308)
        const ratio = score / 0.5;
        const r = Math.round(239 + ratio * (234 - 239));
        const g = Math.round(68 + ratio * (179 - 68));
        const b = Math.round(68 + ratio * (8 - 68));
        return `rgb(${r}, ${g}, ${b})`;
      } else {
        // Interpolate between Yellow (#eab308) and Emerald (#10b981)
        const ratio = (score - 0.5) / 0.5;
        const r = Math.round(234 + ratio * (16 - 234));
        const g = Math.round(179 + ratio * (185 - 179));
        const b = Math.round(8 + ratio * (129 - 8));
        return `rgb(${r}, ${g}, ${b})`;
      }
    };

    const getClassName = (score: number) => {
      if (score < 0.4) return 'route-risk';
      if (score > 0.7) return 'route-safe';
      return '';
    };

    const segments: { positions: [number, number][], color: string, className?: string }[] = [];
    
    // Group points into segments based on color bins to optimize rendering
    // 20 bins means 5% score increments for a smooth gradient
    const getBin = (score: number) => Math.round(score * 20);
    
    let currentSegment = { positions: [route[0]], colorBin: getBin(pointScores[0]) };
    
    for (let i = 1; i < route.length; i++) {
      const bin = getBin(pointScores[i]);
      if (bin === currentSegment.colorBin) {
        currentSegment.positions.push(route[i]);
      } else {
        currentSegment.positions.push(route[i]); // Connect to next point to avoid gaps
        segments.push({
          positions: currentSegment.positions,
          color: getColor(currentSegment.colorBin / 20),
          className: getClassName(currentSegment.colorBin / 20)
        });
        currentSegment = { positions: [route[i]], colorBin: bin };
      }
    }
    if (currentSegment.positions.length > 1) {
      segments.push({
        positions: currentSegment.positions,
        color: getColor(currentSegment.colorBin / 20),
        className: getClassName(currentSegment.colorBin / 20)
      });
    }
    
    return segments;
  };

  const handleSelectOrigin = (res: any) => {
    if (res.placeId && window.google) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ placeId: res.placeId }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const newOrigin = { ...res, lat: location.lat(), lng: location.lng() };
          setOrigin(newOrigin);
          setOriginQuery(res.name);
          setOriginResults([]);
          setMapCenter([location.lat(), location.lng()]);
        }
      });
    } else {
      setOrigin(res);
      setOriginQuery(res.name);
      setOriginResults([]);
      if (res.lat && res.lng) setMapCenter([res.lat, res.lng]);
    }
  };

  const handleSelectDestination = (res: any) => {
    if (res.placeId && window.google) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ placeId: res.placeId }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const newDest = { ...res, lat: location.lat(), lng: location.lng() };
          setDestination(newDest);
          setDestQuery(res.name);
          setDestResults([]);
          setMapCenter([location.lat(), location.lng()]);
        }
      });
    } else {
      setDestination(res);
      setDestQuery(res.name);
      setDestResults([]);
      if (res.lat && res.lng) setMapCenter([res.lat, res.lng]);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-96 bg-zinc-900 border-r border-zinc-800 flex flex-col z-10 shadow-2xl">
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
            <MapPin className="text-blue-500" />
            SafeRoute <span className="text-blue-500">AI</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Find the safest path to your destination</p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Search Inputs */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-purple-500"></div>
              <input 
                type="text" 
                value={originQuery}
                onChange={(e) => { setOriginQuery(e.target.value); setOrigin(null); }}
                placeholder="AI Search starting point..." 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-10 pr-10 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button 
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const { latitude, longitude } = position.coords;
                        setMapCenter([latitude, longitude]);
                        setMapZoom(15);
                        if (!originQuery || !origin) {
                          setOrigin({ lat: latitude, lng: longitude, name: 'Current Location' });
                          setOriginQuery('Current Location');
                        }
                      },
                      (error) => {
                        console.error("Error getting location: ", error);
                      }
                    );
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-blue-400 transition-colors"
                title="Use Current Location"
              >
                <Navigation size={16} />
              </button>
              {originResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50">
                  {originResults.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectOrigin(res)}
                      className="w-full text-left px-4 py-3 hover:bg-zinc-700 flex items-start gap-3 transition-colors border-b border-zinc-700/50 last:border-0"
                    >
                      <div className="mt-0.5 shrink-0">
                        {res.isSafeZone ? <ShieldCheck size={16} className="text-green-400" /> : <Sparkles size={16} className="text-blue-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-zinc-200">{res.name}</span>
                          {res.traffic && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              res.traffic === 'Light' ? 'bg-green-500/20 text-green-400' :
                              res.traffic === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {res.traffic} Traffic
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 line-clamp-1">
                          {res.type !== 'Location' && <span className="text-blue-400 font-medium mr-1">{res.type} • </span>}
                          {res.fullName}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500"></div>
              <input 
                type="text" 
                value={destQuery}
                onChange={(e) => { setDestQuery(e.target.value); setDestination(null); }}
                placeholder="AI Search destination..." 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              {destResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50">
                  {destResults.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectDestination(res)}
                      className="w-full text-left px-4 py-3 hover:bg-zinc-700 flex items-start gap-3 transition-colors border-b border-zinc-700/50 last:border-0"
                    >
                      <div className="mt-0.5 shrink-0">
                        {res.isSafeZone ? <ShieldCheck size={16} className="text-green-400" /> : <Sparkles size={16} className="text-blue-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-zinc-200">{res.name}</span>
                          {res.traffic && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              res.traffic === 'Light' ? 'bg-green-500/20 text-green-400' :
                              res.traffic === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {res.traffic} Traffic
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 line-clamp-1">
                          {res.type !== 'Location' && <span className="text-blue-400 font-medium mr-1">{res.type} • </span>}
                          {res.fullName}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={calculateSafeRoute}
                disabled={!origin || !destination || isCalculating}
                className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  !origin || !destination 
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                }`}
              >
                {isCalculating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Navigation size={18} />
                    {route ? 'Recalculate' : 'Find Safe Route'}
                  </>
                )}
              </button>

              {route && (
                <button
                  onClick={() => {
                    setRoute(null);
                    setSafetyStats(null);
                    setEta(null);
                    setDistance(null);
                    setDirections([]);
                    setShowDirections(false);
                    setFacilities([]);
                  }}
                  className="px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center transition-all bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  title="Clear Route"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Live Traffic Toggle */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={16} className={showTraffic ? "text-blue-400 animate-pulse" : "text-zinc-500"} />
                  <span className="text-sm font-medium text-zinc-300">Live Traffic Layer</span>
                </div>
                <button
                  onClick={() => {
                    const nextState = !showTraffic;
                    setShowTraffic(nextState);
                    if (nextState) setShowHistoricalTraffic(false);
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    showTraffic ? 'bg-blue-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      showTraffic ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Traffic Legend */}
              <div className={`overflow-hidden transition-all duration-300 ${showTraffic ? 'max-h-12 opacity-100 mt-3 pt-3 border-t border-zinc-800/50' : 'max-h-0 opacity-0 mt-0 pt-0 border-transparent'}`}>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#22c55e]"></div>
                    <span>Fast</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                    <span>Moderate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div>
                    <span>Slow</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#7f1d1d]"></div>
                    <span>Heavy</span>
                  </div>
                </div>
              </div>
            </div>

            {savedRoutes.length > 0 && (
              <div className="pt-6 border-t border-zinc-800">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Bookmark size={14} /> Saved Routes
                </h3>
                <div className="space-y-2">
                  {savedRoutes.map((saved) => (
                    <div 
                      key={saved.id}
                      onClick={() => handleLoadRoute(saved)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 cursor-pointer hover:border-zinc-700 transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-zinc-200 line-clamp-1 pr-2">{saved.name}</span>
                        <button 
                          onClick={(e) => handleDeleteRoute(saved.id, e)}
                          className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete saved route"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center text-xs text-zinc-500">
                        <span>{saved.distance} • {saved.eta}</span>
                        <span className={`px-1.5 py-0.5 rounded-full ${saved.safetyStats?.isSafe ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                          {saved.safetyStats?.score}% Safe
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Route Info & Safety Stats */}
          {route && safetyStats && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Route Summary */}
              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Route Summary</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleShareRoute}
                      className="text-xs flex items-center gap-1 transition-colors px-2 py-1 rounded text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20"
                    >
                      <Share2 size={14} /> {shareCopied ? 'Copied!' : 'Share'}
                    </button>
                    <button 
                      onClick={handleSaveRoute}
                      disabled={isRouteSaved}
                      className={`text-xs flex items-center gap-1 transition-colors px-2 py-1 rounded ${
                        isRouteSaved 
                          ? 'text-green-400 bg-green-500/10 cursor-default' 
                          : 'text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20'
                      }`}
                    >
                      {isRouteSaved ? (
                        <><Bookmark size={14} className="fill-current" /> Saved</>
                      ) : (
                        <><Save size={14} /> Save</>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-400 flex items-center gap-2"><Clock size={16} /> Estimated Time</span>
                  <span className="font-bold text-lg text-white">{eta}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-400 flex items-center gap-2"><Navigation size={16} /> Distance</span>
                  <span className="font-medium text-zinc-300">{distance}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-800/50 mt-2">
                  <span className="text-sm text-zinc-400 flex items-center gap-2"><Activity size={16} /> Traffic Condition</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    safetyStats.trafficCondition === 'Light' ? 'bg-green-500/20 text-green-400' :
                    safetyStats.trafficCondition === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {safetyStats.trafficCondition}
                  </span>
                </div>
              </div>

              {/* Safety Score */}
              <div className={`rounded-xl p-5 border relative overflow-hidden transition-all duration-500 ${
                safetyStats.isSafe 
                  ? 'bg-green-500/10 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
                  : 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.2)]'
              }`}>
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 ${
                  safetyStats.isSafe ? 'bg-green-500' : 'bg-orange-500 animate-pulse'
                }`}></div>
                
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 relative z-10">Route Safety Analysis</h3>
                
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 relative ${
                    safetyStats.isSafe ? 'border-green-500 text-green-500' : 'border-orange-500 text-orange-500'
                  }`}>
                    {!safetyStats.isSafe && (
                      <div className="absolute inset-0 rounded-full border-4 border-orange-500 animate-ping opacity-20"></div>
                    )}
                    <span className="text-xl font-bold">{safetyStats.score}%</span>
                  </div>
                  <div>
                    <h4 className={`text-xl font-bold flex items-center gap-2 ${
                      safetyStats.isSafe ? 'text-green-400' : 'text-orange-400'
                    }`}>
                      {safetyStats.isSafe ? <ShieldCheck size={24} /> : <AlertTriangle size={24} className="animate-pulse" />}
                      {safetyStats.isSafe ? 'Generally Safe' : 'Exercise Caution'}
                    </h4>
                    <p className="text-sm text-zinc-400 mt-1">Based on recent crime data & route</p>
                  </div>
                </div>

                {safetyStats.hotspots && safetyStats.hotspots.length > 0 && (
                  <div className="mb-4 relative z-10 bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50">
                    <h5 className="text-xs font-medium text-zinc-400 uppercase mb-2 flex items-center gap-1">
                      <AlertTriangle size={14} className="text-yellow-500" /> Hazard Hotspots
                    </h5>
                    <div className="space-y-1">
                      {safetyStats.hotspots.map((hotspot: any) => (
                        <div 
                          key={hotspot.id} 
                          className="flex justify-between items-center text-sm cursor-pointer hover:bg-zinc-800/50 p-1.5 -mx-1.5 rounded transition-colors"
                          onMouseEnter={() => setHoveredHotspot(hotspot)}
                          onMouseLeave={() => setHoveredHotspot(null)}
                        >
                          <span className="text-zinc-300">{hotspot.type}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            hotspot.severity === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {hotspot.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 relative z-10">
                  <h5 className="text-xs font-medium text-zinc-500 uppercase">Reported Incidents Breakdown</h5>
                  {safetyStats.crimes.map((crime: any, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-300">{crime.type}</span>
                        <span className="text-zinc-500">{crime.percent}%</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${safetyStats.isSafe ? 'bg-green-500/50' : 'bg-orange-500/50'}`} 
                          style={{ width: `${crime.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency Services Found */}
              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Services Along Route</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-zinc-900 rounded-lg p-2 border border-zinc-800">
                    <div className="text-blue-500 flex justify-center mb-1"><ShieldAlert size={18} /></div>
                    <div className="text-lg font-bold">{facilities.filter(f => f.tags?.amenity === 'police').length}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">Police</div>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-2 border border-zinc-800">
                    <div className="text-green-500 flex justify-center mb-1"><Activity size={18} /></div>
                    <div className="text-lg font-bold">{facilities.filter(f => f.tags?.amenity === 'hospital').length}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">Hospitals</div>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-2 border border-zinc-800">
                    <div className="text-emerald-500 flex justify-center mb-1"><Plus size={18} /></div>
                    <div className="text-lg font-bold">{facilities.filter(f => f.tags?.amenity === 'pharmacy').length}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">Pharmacies</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative z-0 overflow-hidden">
        {/* Floating ETA & Distance Panel */}
        {route && eta && distance && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl p-4 flex items-center gap-6 animate-in slide-in-from-top-4">
            <div className="flex flex-col">
              <span className="text-zinc-400 text-[10px] font-medium uppercase tracking-wider mb-0.5">Est. Time</span>
              <span className="text-xl font-bold text-white flex items-center gap-2">
                <Clock size={18} className="text-blue-400" />
                {eta}
              </span>
            </div>
            <div className="w-px h-10 bg-zinc-800"></div>
            <div className="flex flex-col">
              <span className="text-zinc-400 text-[10px] font-medium uppercase tracking-wider mb-0.5">Distance</span>
              <span className="text-xl font-bold text-white flex items-center gap-2">
                <Navigation size={18} className="text-emerald-400" />
                {distance}
              </span>
            </div>
            <div className="w-px h-10 bg-zinc-800"></div>
            <button 
              onClick={() => setShowDirections(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <List size={16} />
              Directions
            </button>
          </div>
        )}

        {/* Directions Side Panel */}
        {showDirections && (
          <div className="absolute top-0 right-0 bottom-0 w-96 bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800 z-[1001] flex flex-col shadow-2xl animate-in slide-in-from-right-8">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <List size={20} className="text-blue-400" />
                Turn-by-Turn
              </h2>
              <button 
                onClick={() => setShowDirections(false)}
                className="text-zinc-400 hover:text-white transition-colors p-1 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {directions.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="mt-1 shrink-0">
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                      {idx + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div 
                      className="text-sm text-zinc-200 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: step.html_instructions }} 
                    />
                    <div className="text-xs text-zinc-500 mt-1.5 flex gap-2 font-medium">
                      <span className="bg-zinc-900 px-1.5 py-0.5 rounded">{step.distance?.text}</span>
                      <span className="bg-zinc-900 px-1.5 py-0.5 rounded">{step.duration?.text}</span>
                    </div>
                  </div>
                </div>
              ))}
              {directions.length === 0 && (
                <div className="text-center text-zinc-500 mt-10">
                  No directions available for this route.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hovered Hotspot Modal */}
        {hoveredHotspot && (
          <div className="absolute bottom-6 right-6 z-[1000] bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl p-4 w-72 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${hoveredHotspot.severity === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  <AlertTriangle size={16} />
                </div>
                <h3 className="font-bold text-white text-sm">{hoveredHotspot.type}</h3>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                hoveredHotspot.severity === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {hoveredHotspot.severity} Risk
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              {hoveredHotspot.description}
            </p>
          </div>
        )}

        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <MapController center={mapCenter} zoom={mapZoom} bounds={mapBounds} />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {showTraffic && (
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=h,traffic&x={x}&y={y}&z={z}"
              attribution='&copy; Google Maps'
              opacity={0.8}
            />
          )}

          {/* Origin Marker */}
          {origin && (
            <Marker position={[origin.lat, origin.lng]} icon={customOriginIcon}>
              <Popup>
                <div className="text-zinc-900 font-medium">Start: {origin.name}</div>
              </Popup>
            </Marker>
          )}

          {/* Destination Marker */}
          {destination && (
            <Marker position={[destination.lat, destination.lng]} icon={customDestIcon}>
              <Popup>
                <div className="text-zinc-900 font-medium">Destination: {destination.name}</div>
              </Popup>
            </Marker>
          )}

          {/* Hazard Hotspots */}
          {safetyStats?.hotspots?.map((hotspot: any) => (
            <Marker 
              key={hotspot.id} 
              position={[hotspot.lat, hotspot.lng]} 
              icon={customHazardIcon}
              eventHandlers={{
                mouseover: () => setHoveredHotspot(hotspot),
                mouseout: () => setHoveredHotspot(null),
              }}
            />
          ))}

          {/* Fetched Facilities Along Route */}
          {facilities.map((fac) => {
            let icon = customHospitalIcon;
            let typeName = "Hospital";
            if (fac.tags?.amenity === 'pharmacy') { icon = customPharmacyIcon; typeName = "Pharmacy"; }
            else if (fac.tags?.amenity === 'police') { icon = customPoliceIcon; typeName = "Police Station"; }

            return (
              <Marker key={`fac-${fac.id}`} position={[fac.lat, fac.lon]} icon={icon}>
                <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
                  <div className="text-xs font-semibold">{fac.tags?.name || typeName}</div>
                </Tooltip>
                <Popup>
                  <div className="text-zinc-900 font-medium">{fac.tags?.name || `Unnamed ${typeName}`}</div>
                  <div className="text-zinc-500 text-sm">{typeName}</div>
                </Popup>
              </Marker>
            );
          })}

          {/* Route Polyline - Colored by Safety or Historical Traffic */}
          {route && (showHistoricalTraffic ? getHistoricalTrafficSegments() : getColoredRouteSegments()).map((segment: any, index) => (
            <React.Fragment key={`route-segment-group-${index}`}>
              {/* Outer glow/border for better visibility */}
              <Polyline 
                positions={segment.positions} 
                color={segment.color} 
                weight={10} 
                opacity={0.3} 
                className={segment.className}
              />
              {/* Core line */}
              <Polyline 
                positions={segment.positions} 
                color={segment.color} 
                weight={5} 
                opacity={1} 
                className={segment.className}
              />
            </React.Fragment>
          ))}

          {/* Simulated Fleet Vehicles */}
          {fleet.map((v) => {
            let icon = customAmbulanceIcon;
            if (v.type === 'fire') icon = customFireIcon;
            else if (v.type === 'police') icon = customPoliceIcon;

            return (
              <Marker key={v.id} position={[v.lat, v.lng]} icon={icon}>
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
            <Marker key={v.id} position={[v.lat, v.lng]} icon={customAmbulanceIcon}>
              <Popup>
                <div className="text-zinc-900 font-medium">{v.id}</div>
                <div className="text-zinc-500 text-sm">User Vehicle</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Overlay UI Controls - Top Right */}
        <div className="absolute right-6 top-6 flex flex-col gap-2 z-[1000]">
          {/* Historical Traffic Panel */}
          <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/80 rounded-xl p-3 shadow-lg w-64">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Clock size={14} /> Historical Traffic
            </h4>
            <div className="space-y-2">
              <input 
                type="date" 
                value={historicalDate}
                onChange={(e) => setHistoricalDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <input 
                type="time" 
                value={historicalTime}
                onChange={(e) => setHistoricalTime(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                onClick={() => {
                  const nextState = !showHistoricalTraffic;
                  setShowHistoricalTraffic(nextState);
                  if (nextState) setShowTraffic(false);
                }}
                disabled={!historicalDate || !historicalTime}
                className={`w-full py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                  !historicalDate || !historicalTime
                    ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                    : showHistoricalTraffic
                      ? 'bg-blue-600/90 text-white border border-blue-500 shadow-blue-900/20'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                <Activity size={14} />
                {showHistoricalTraffic ? 'Historical: On' : 'Historical: Off'}
              </button>
            </div>
          </div>
        </div>

        {/* Overlay UI Controls - Bottom Right */}
        <div className="absolute right-6 bottom-6 flex flex-col gap-2 z-[1000]">
          {/* Route Safety / Historical Traffic Legend */}
          {route && (
            <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-3 shadow-lg mb-2 mr-2">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                {showHistoricalTraffic ? 'Historical Traffic' : 'Route Safety'}
              </h4>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${showHistoricalTraffic ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`}></div>
                  <span className="text-xs text-zinc-300">{showHistoricalTraffic ? 'Clear' : 'Safe Zone'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${showHistoricalTraffic ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]'}`}></div>
                  <span className="text-xs text-zinc-300">{showHistoricalTraffic ? 'Light Traffic' : 'Moderate Risk'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${showHistoricalTraffic ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></div>
                  <span className="text-xs text-zinc-300">{showHistoricalTraffic ? 'Moderate Traffic' : 'High Risk Area'}</span>
                </div>
                {showHistoricalTraffic && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                    <span className="text-xs text-zinc-300">Heavy Traffic</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <button 
            onClick={() => {
              if (route && mapBounds) {
                setMapBounds([...mapBounds as any]); // trigger re-render bounds
              } else {
                setMapCenter(defaultCenter);
                setMapZoom(12);
              }
            }}
            className="bg-zinc-900/90 hover:bg-zinc-800 text-white p-3 rounded-xl shadow-lg border border-zinc-800/50 backdrop-blur-sm transition-all group"
            title="Center Map"
          >
            <Crosshair size={20} className="group-hover:text-blue-500 transition-colors" />
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
      </div>
    </div>
  );
}
