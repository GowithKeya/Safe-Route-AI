import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import http from 'http';
import { API_KEYS } from './src/apikeys';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/directions', async (req, res) => {
    const { origin, destination, mode = 'driving' } = req.query;
    const apiKey = API_KEYS.GOOGLE_MAPS_API_KEY;
    
    try {
      if (apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY') {
        // Use Google Maps Directions API
        const googleUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=${mode}&alternatives=true&key=${apiKey}`;
        const response = await fetch(googleUrl);
        const data = await response.json();
        
        if (data.status === 'OK') {
          return res.json({ routes: data.routes });
        }
        console.warn("Google Maps Directions failed, falling back to OSRM:", data.status);
      }
      
      // Fallback to OSRM API
      let osrmProfile = 'driving';
      if (mode === 'walking') osrmProfile = 'foot';
      if (mode === 'bicycling') osrmProfile = 'bike';
      // OSRM doesn't support transit, fallback to driving
      
      const [oLat, oLng] = (origin as string).split(',');
      const [dLat, dLng] = (destination as string).split(',');
      
      const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmProfile}/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson&alternatives=true&steps=true`;
      
      const response = await fetch(osrmUrl);
      const data = await response.json();
      
      if (data.code !== 'Ok') {
        return res.status(400).json({ error: 'Failed to fetch directions from OSRM' });
      }
      
      // Map OSRM response to Google Maps format
      const routes = data.routes.map((route: any) => {
        return {
          summary: route.legs[0].summary || 'OSRM Route',
          legs: [{
            distance: { text: `${(route.distance / 1000).toFixed(1)} km`, value: route.distance },
            duration: { text: `${Math.round(route.duration / 60)} mins`, value: route.duration },
            steps: route.legs[0].steps.map((step: any) => ({
              html_instructions: step.maneuver.instruction || `${step.maneuver.type} ${step.maneuver.modifier || ''} on ${step.name || 'road'}`,
              distance: { text: `${(step.distance / 1000).toFixed(1)} km`, value: step.distance },
              duration: { text: `${Math.round(step.duration / 60)} mins`, value: step.duration }
            }))
          }],
          overview_polyline: {
            points: route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]])
          }
        };
      });
      
      res.json({ routes });
    } catch (error) {
      console.error("Error fetching directions:", error);
      res.status(500).json({ error: 'Failed to fetch directions' });
    }
  });

  app.get('/api/places/autocomplete', async (req, res) => {
    const { input } = req.query;
    const apiKey = API_KEYS.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      return res.status(400).json({ error: 'Google Maps API key not configured' });
    }
    
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input as string)}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching places autocomplete:", error);
      res.status(500).json({ error: 'Failed to fetch places' });
    }
  });

  app.get('/api/places/details', async (req, res) => {
    const { place_id } = req.query;
    const apiKey = API_KEYS.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      return res.status(400).json({ error: 'Google Maps API key not configured' });
    }
    
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=geometry,name,formatted_address&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching place details:", error);
      res.status(500).json({ error: 'Failed to fetch place details' });
    }
  });

  // Socket.io for live tracking
  const simulatedVehicles = [
    { id: 'FIRE-204', type: 'fire', lat: 28.6239, lng: 77.2190, status: 'Responding to Fire', speed: 45 },
    { id: 'POL-309', type: 'police', lat: 28.6039, lng: 77.1990, status: 'Patrolling', speed: 30 },
    { id: 'AMB-404', type: 'ambulance', lat: 28.6189, lng: 77.2040, status: 'Standby', speed: 0 },
    { id: 'FIRE-112', type: 'fire', lat: 28.6100, lng: 77.2200, status: 'Returning to Station', speed: 35 },
    { id: 'POL-411', type: 'police', lat: 28.6000, lng: 77.2100, status: 'En Route to Incident', speed: 55 },
  ];

  // Dynamic status for POL-309
  let pol309State = 'Patrolling';
  let pol309Timer = Date.now();

  setInterval(() => {
    const now = Date.now();
    
    // Toggle POL-309 status every 5 minutes (300,000 ms)
    if (now - pol309Timer > 300000) {
      pol309State = pol309State === 'Patrolling' ? 'Investigating Scene' : 'Patrolling';
      pol309Timer = now;
    }

    simulatedVehicles.forEach(v => {
      v.lat += (Math.random() - 0.5) * 0.001;
      v.lng += (Math.random() - 0.5) * 0.001;
      
      if (v.id === 'POL-309') {
        v.status = pol309State;
      }

      // Randomize speed slightly based on status
      if (v.status === 'Standby' || v.status === 'Investigating Scene') {
        v.speed = 0;
      } else {
        v.speed = Math.max(10, Math.min(80, v.speed + (Math.random() - 0.5) * 10));
      }
    });
    io.emit('fleetUpdate', simulatedVehicles);
  }, 2000);

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // Send initial fleet state
    socket.emit('fleetUpdate', simulatedVehicles);

    socket.on('updateLocation', (data) => {
      // Broadcast location to all clients (hospitals, public)
      socket.broadcast.emit('vehicleLocationUpdate', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
