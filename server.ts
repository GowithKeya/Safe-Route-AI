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
    const { origin, destination } = req.query;
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'Google Maps API key is missing' });
    }
    
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&departure_time=now&key=${apiKey}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching directions:", error);
      res.status(500).json({ error: 'Failed to fetch directions' });
    }
  });

  // Socket.io for live tracking
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

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
