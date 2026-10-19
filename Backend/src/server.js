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
  res.json({
    status: 'ok',
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/overview', overviewRoutes);
app.use('/api/deepgram', deepgramRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(`🚀 STORE LISTENER BACKEND READY`);
      console.log(`📡 Server listening on port: ${PORT}`);
      console.log(`🌐 Local:   http://localhost:${PORT}`);
      console.log(`💬 Socket.IO real-time server connected`);
      console.log(`🤖 Deepgram Nova-2 Integration: Enabled`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Fatal: Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server };
