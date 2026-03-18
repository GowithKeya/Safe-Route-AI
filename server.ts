import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import http from 'http';

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
    const { origin, destination, avoid, preference } = req.query;
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'Google Maps API key is missing' });
    }
    
    try {
      let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&departure_time=now&key=${apiKey}`;
      
      if (avoid) {
        url += `&avoid=${avoid}`;
      }
      
      if (preference === 'shortest') {
        url += `&alternatives=true`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (preference === 'shortest' && data.routes && data.routes.length > 1) {
        // Sort routes by distance
        data.routes.sort((a: any, b: any) => {
          const distA = a.legs[0].distance.value;
          const distB = b.legs[0].distance.value;
          return distA - distB;
        });
      }
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching directions:", error);
      res.status(500).json({ error: 'Failed to fetch directions' });
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
