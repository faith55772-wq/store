const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('[Database] MONGODB_URI environment variable is missing!');
    return false;
  }

  const connectWithRetry = async () => {
    try {
      console.log('[Database] Connecting to MongoDB Atlas...');
      const conn = await mongoose.connect(mongoUri, {
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
      });

      isConnected = true;
      console.log(`[Database] MongoDB Connected: ${conn.connection.host} / DB: ${conn.connection.name}`);

      mongoose.connection.on('error', (err) => {
        console.error('[Database] MongoDB connection error:', err.message);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('[Database] MongoDB disconnected. Reconnecting...');
        isConnected = false;
        setTimeout(connectWithRetry, 5000);
      });

      return conn;
    } catch (error) {
      isConnected = false;
      console.error(`[Database] Connection Error: ${error.message}`);
      if (error.message.includes('whitelisted') || error.message.includes('Could not connect to any servers')) {
        console.warn('========================================================================');
        console.warn('⚠️  MONGODB ATLAS IP ACCESS LIST / WHITELIST NOTICE:');
        console.warn('Render runs on dynamic cloud IPs. To allow Render to access your database:');
        console.warn('1. Go to cloud.mongodb.com -> Login');
        console.warn('2. Click "Network Access" in the left sidebar');
        console.warn('3. Click "Add IP Address" -> Select "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0)');
        console.warn('4. Click "Confirm". Connection will succeed automatically!');
        console.warn('========================================================================');
      }
      console.log('[Database] Will retry connection to MongoDB in 8 seconds...');
      setTimeout(connectWithRetry, 8000);
    }
  };

  await connectWithRetry();
  return isConnected;
};

module.exports = connectDB;
