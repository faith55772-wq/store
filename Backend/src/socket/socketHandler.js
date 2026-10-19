const Store = require('../models/Store');
const Recording = require('../models/Recording');
const { translateSpanishToEnglishFast, isSpanish } = require('../services/deepgramService');

// Active store connections map: storeId -> socketId & metadata
const activeStores = new Map();

function initSocketIO(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] New client connected: ${socket.id}`);

    // --- 1. Store Client (.exe Desktop or Web Store Terminal) Events ---
    socket.on('store:join', async (data) => {
      const { storeId, name, location, systemInfo } = data;
      if (!storeId) return;

      socket.storeId = storeId;
      socket.join(`store:${storeId}`);

      activeStores.set(storeId, {
        socketId: socket.id,
        storeId,
        name: name || 'Store Location',
        location: location || 'United States',
        isRecording: false,
        activeMic: systemInfo?.activeMic || 'Microphone',
        connectedAt: new Date(),
      });

      console.log(`[Socket.IO] Store joined room: store:${storeId} (${name})`);

      // Update store last seen in DB
      try {
        await Store.findOneAndUpdate(
          { storeId },
          { lastSeenAt: new Date(), 'systemInfo.activeMic': systemInfo?.activeMic },
          { new: true }
        );
      } catch (e) {
        console.error('[Socket.IO] Failed to update store lastSeenAt:', e.message);
      }

      // Notify Admin monitor of store presence
      io.to('admin:monitors').emit('store:presence_updated', {
        storeId,
        status: 'online',
        activeStores: Array.from(activeStores.values()),
      });
    });

    // Store starts recording (Section 3.2 & 4.2.3 -> LIVE badge)
    socket.on('store:recording_started', async (data) => {
      const storeId = data.storeId || socket.storeId;
      if (!storeId) return;

      const storeData = activeStores.get(storeId) || {
        storeId,
        name: data.storeName || 'Store Location',
        location: data.location || 'United States',
      };
      storeData.isRecording = true;
      storeData.recordingStartedAt = new Date();
      activeStores.set(storeId, storeData);

      try {
        await Store.findOneAndUpdate({ storeId }, { isRecording: true });
      } catch (e) {}

      console.log(`[Socket.IO] Store ${storeId} started recording -> Status: LIVE`);

      // Broadcast immediately to Admin Live Monitor: green LIVE badge
      io.to('admin:monitors').emit('stream:status_change', {
        storeId,
        storeName: storeData.name,
        location: storeData.location,
        status: 'LIVE',
        isRecording: true,
        timestamp: new Date(),
      });
    });

    // Real-time live transcript stream (Section 3.4 & 4.2.4: Synchronized word-for-word in English)
    socket.on('stream:transcript', (data) => {
      const { storeId, storeName, location, text, originalText, isFinal, speaker, language, timestamp } = data;
      if (!text && !originalText) return;

      // Ensure English output at all times (Section 3.4.2)
      let englishText = text;
      if (language === 'es' || isSpanish(originalText || text)) {
        englishText = translateSpanishToEnglishFast(originalText || text);
      }

      // Live streaming broadcast to Web Portal Live Monitor
      io.to('admin:monitors').emit('stream:live_word', {
        storeId: storeId || socket.storeId,
        storeName,
        location,
        text: englishText,
        originalText: originalText || text,
        speaker: speaker || 'R',
        isFinal: isFinal || false,
        languageDetected: language || 'en',
        timestamp: timestamp || Date.now(),
      });
    });

    // Store stops recording (Section 3.2.3 & 4.2.3 -> ENDED badge)
    socket.on('store:recording_stopped', async (data) => {
      const storeId = data.storeId || socket.storeId;
      if (!storeId) return;

      const storeData = activeStores.get(storeId);
      if (storeData) {
        storeData.isRecording = false;
        activeStores.set(storeId, storeData);
      }

      try {
        await Store.findOneAndUpdate({ storeId }, { isRecording: false });
      } catch (e) {}

      console.log(`[Socket.IO] Store ${storeId} stopped recording -> Status: ENDED`);

      // Broadcast immediately to Admin Live Monitor: red ENDED badge
      io.to('admin:monitors').emit('stream:status_change', {
        storeId,
        status: 'ENDED',
        isRecording: false,
        timestamp: new Date(),
      });
    });

    // --- 2. Admin Live Monitor Events ---
    socket.on('admin:join_monitor', () => {
      socket.join('admin:monitors');
      console.log(`[Socket.IO] Admin socket ${socket.id} joined admin:monitors room`);

      // Send initial snapshot of all active streams and stores
      socket.emit('admin:initial_state', {
        activeStores: Array.from(activeStores.values()),
      });
    });

    // Admin approves store via socket
    socket.on('admin:approve_store_direct', async ({ storeId }) => {
      try {
        const store = await Store.findOneAndUpdate(
          { storeId },
          { status: 'approved', approvedAt: new Date() },
          { new: true }
        );

        io.to(`store:${storeId}`).emit('store:approved', {
          storeId,
          status: 'approved',
          autoStartRecording: true,
        });

        io.emit('store:status_updated', { storeId, status: 'approved' });
      } catch (err) {
        console.error('[Socket.IO] Approval direct error:', err.message);
      }
    });

    // --- 3. Disconnect Handling (System shutdown / computer turned OFF -> ENDED badge) ---
    socket.on('disconnect', async () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      if (socket.storeId) {
        const storeId = socket.storeId;
        const storeData = activeStores.get(storeId);

        if (storeData) {
          activeStores.delete(storeId);
        }

        try {
          await Store.findOneAndUpdate({ storeId }, { isRecording: false });
        } catch (e) {}

        // Immediate ENDED badge notification on Web Portal
        io.to('admin:monitors').emit('stream:status_change', {
          storeId,
          status: 'ENDED',
          isRecording: false,
          offline: true,
          timestamp: new Date(),
        });
      }
    });
  });
}

module.exports = {
  initSocketIO,
  activeStores,
};
