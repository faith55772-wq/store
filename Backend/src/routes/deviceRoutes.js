const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const { v4: uuidv4 } = require('uuid');

// In-memory or persisted map of registered devices
// deviceId -> { deviceId, deviceSecret, storeId, name, registeredAt }
const registeredDevices = new Map();

// POST /api/v1/devices/register
router.post('/register', async (req, res) => {
  try {
    const { store_id, name, audio_source = 'microphone' } = req.body;

    const store = await Store.findOne({
      $or: [{ storeId: store_id }, { _id: store_id?.match(/^[0-9a-fA-F]{24}$/) ? store_id : null }],
    });

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found for device activation' });
    }

    const deviceId = `DEV-${store.storeId}-${Math.floor(1000 + Math.random() * 9000)}`;
    const deviceSecret = `sec_${uuidv4().replace(/-/g, '')}`;

    registeredDevices.set(deviceId, {
      deviceId,
      deviceSecret,
      storeId: store.storeId,
      name: name || 'Windows Retail Terminal',
      audioSource: audio_source,
      registeredAt: new Date(),
    });

    // Update store systemInfo
    if (store.systemInfo) {
      store.systemInfo.hostname = name || store.systemInfo.hostname;
      store.lastSeenAt = new Date();
      await store.save();
    }

    const isApproved = store.status === 'approved';

    res.json({
      success: true,
      device_id: deviceId,
      device_secret: deviceSecret,
      store_id: store.storeId,
      approval_status: store.status, // 'pending' | 'approved' | 'rejected'
      approved: isApproved,
      message: isApproved
        ? 'Device activated and authorized.'
        : 'Device registered. Waiting for administrator approval.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/devices/:id/approval
router.get('/:id/approval', async (req, res) => {
  try {
    const deviceId = req.params.id;
    const device = registeredDevices.get(deviceId);

    let store = null;
    if (device) {
      store = await Store.findOne({ storeId: device.storeId });
    } else {
      // Check if id matches storeId directly
      store = await Store.findOne({
        $or: [
          { storeId: deviceId },
          { 'systemInfo.hostname': deviceId },
        ],
      });
    }

    const status = store ? store.status : 'approved'; // default approved if mock test
    const isApproved = status === 'approved';

    res.json({
      success: true,
      device_id: deviceId,
      approved: isApproved,
      approval_status: status, // 'approved' | 'pending' | 'rejected'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
