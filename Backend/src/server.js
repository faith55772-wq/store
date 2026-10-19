const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const { initSocketIO } = require('./socket/socketHandler');

const authRoutes = require('./routes/authRoutes');
const storeRoutes = require('./routes/storeRoutes');
const recordingRoutes = require('./routes/recordingRoutes');
const reportRoutes = require('./routes/reportRoutes');
const overviewRoutes = require('./routes/overviewRoutes');
const deepgramRoutes = require('./routes/deepgramRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const audioRoutes = require('./routes/audioRoutes');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);

// CORS configuration (supporting both localhost and production Render domains)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static audio files folder
const storageDir = path.join(__dirname, '..', 'storage');
app.use('/storage', express.static(storageDir));

// Attach Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set('io', io);
initSocketIO(io);

// Health check endpoint for Render.com deployment
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'ok',
    database: isDbConnected ? 'connected' : 'connecting_or_check_whitelist',
    timestamp: new Date(),
    service: 'Store Listener Backend API',
    uptime: process.uptime(),
  });
});

// Root API info
app.get('/', (req, res) => {
  res.json({
    name: 'Store Listener API',
    version: '1.0.0',
    description: 'AI Sales Monitoring & Conversation Intelligence Platform',
    endpoints: {
      auth: '/api/auth',
      stores: '/api/stores',
      recordings: '/api/recordings',
      reports: '/api/reports',
      overview: '/api/overview',
      deepgram: '/api/deepgram',
      health: '/health',
    },
  });
});

// API Routes (supports both /api and /api/v1)
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);

app.use('/api/stores', storeRoutes);
app.use('/api/v1/stores', storeRoutes);

app.use('/api/recordings', recordingRoutes);
app.use('/api/v1/recordings', recordingRoutes);

app.use('/api/reports', reportRoutes);
app.use('/api/v1/reports', reportRoutes);

app.use('/api/overview', overviewRoutes);
app.use('/api/v1/overview', overviewRoutes);

app.use('/api/deepgram', deepgramRoutes);
app.use('/api/v1/deepgram', deepgramRoutes);

app.use('/api/devices', deviceRoutes);
app.use('/api/v1/devices', deviceRoutes);

app.use('/api/audio', audioRoutes);
app.use('/api/v1/audio', audioRoutes);

// Ready probe endpoint
app.get('/ready', (req, res) => {
  res.json({ status: 'ready', timestamp: new Date() });
});

// Native WebSocket server for desktop-agent health connection (/ws/device/:id)
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname;
  if (pathname.startsWith('/ws/device/')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

wss.on('connection', (ws, request) => {
  ws.on('message', () => {
    try {
      ws.send(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
    } catch (e) {}
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

function startServer() {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 STORE LISTENER BACKEND READY`);
    console.log(`📡 Server listening on port: ${PORT}`);
    console.log(`🌐 Local:   http://localhost:${PORT}`);
    console.log(`💬 Socket.IO real-time server connected`);
    console.log(`🤖 Deepgram Nova-2 Integration: Enabled`);
    console.log(`=======================================================`);
    
    // Connect to database in background with auto-retry
    connectDB().catch((err) => {
      console.warn('[Database] Background connect init notice:', err.message);
    });
  });
}

startServer();

module.exports = { app, server };
