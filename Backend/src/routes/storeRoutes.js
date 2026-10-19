const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const { v4: uuidv4 } = require('uuid');

// Register store from Desktop Client (.exe app)
router.post('/register', async (req, res) => {
  try {
    const { name, location, address, contactPerson, email, phone, systemInfo } = req.body;

    if (!name || !location) {
      return res.status(400).json({ success: false, message: 'Store Name and Location are required' });
    }

    // Generate unique store ID if not provided
    const storeId = req.body.storeId || `STORE-${Math.floor(100 + Math.random() * 900)}`;

    let store = await Store.findOne({
      $or: [{ storeId }, { name: name.trim() }],
    });

    if (store) {
      // Update system info if existing
      if (systemInfo) {
        store.systemInfo = { ...store.systemInfo, ...systemInfo };
      }
      store.lastSeenAt = new Date();
      await store.save();
      return res.json({
        success: true,
        message: 'Store already registered',
        store,
        requiresApproval: store.status !== 'approved',
      });
    }

    store = await Store.create({
      storeId,
      name: name.trim(),
      location: location.trim(),
      address: address || '',
      contactPerson: contactPerson || 'Store Manager',
      email: email || '',
      phone: phone || '',
      status: 'pending', // Approval Gate!
      isRecording: false,
      systemInfo: systemInfo || {
        hostname: 'STORE-PC',
        os: 'Windows 11 Pro',
        activeMic: 'Default Microphone',
        availableMics: [],
        clientVersion: '1.0.0',
      },
      lastSeenAt: new Date(),
    });

    // Notify any active Admin Web Portal sockets of new pending registration
    const io = req.app.get('io');
    if (io) {
      io.emit('store:new_registration', store);
    }

    res.status(201).json({
      success: true,
      message: 'Store registration submitted. Waiting for Admin Approval.',
      store,
      requiresApproval: true,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List all stores
router.get('/', async (req, res) => {
  try {
    const { status, page_size } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const stores = await Store.find(filter).sort({ createdAt: -1 });

    const formattedItems = stores.map((s) => {
      const obj = s.toObject ? s.toObject() : { ...s };
      obj.id = s.storeId;
      obj.city = s.location ? s.location.split(',')[0]?.trim() : 'Dallas';
      obj.region = s.location && s.location.includes(',') ? s.location.split(',')[1]?.trim() : 'TX';
      return obj;
    });

    if (page_size) {
      return res.json({
        success: true,
        count: formattedItems.length,
        stores: {
          items: formattedItems,
          total: formattedItems.length,
          page: 1,
          page_size: parseInt(page_size, 10),
        },
      });
    }

    res.json({ success: true, count: formattedItems.length, stores: formattedItems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List pending approval requests (Section 4.1)
router.get('/pending', async (req, res) => {
  try {
    const pendingStores = await Store.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json({ success: true, count: pendingStores.length, stores: pendingStores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single store details
router.get('/:id', async (req, res) => {
  try {
    const store = await Store.findOne({
      $or: [{ storeId: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }],
    });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    res.json({ success: true, store });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin approves store request (Section 3.1 & 3.2: Auto-Start on Approval)
router.post('/:id/approve', async (req, res) => {
  try {
    const store = await Store.findOne({
      $or: [{ storeId: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }],
    });

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    store.status = 'approved';
    store.approvedAt = new Date();
    await store.save();

    // Trigger instant WebSocket notification to Desktop Client to AUTO-START RECORDING!
    const io = req.app.get('io');
    if (io) {
      io.to(`store:${store.storeId}`).emit('store:approved', {
        storeId: store.storeId,
        status: 'approved',
        autoStartRecording: true,
      });
      io.emit('store:status_updated', {
        storeId: store.storeId,
        status: 'approved',
      });
    }

    res.json({
      success: true,
      message: `Store ${store.name} approved successfully. Auto-start recording trigger sent.`,
      store,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin rejects store request
router.post('/:id/reject', async (req, res) => {
  try {
    const store = await Store.findOne({
      $or: [{ storeId: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }],
    });

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    store.status = 'rejected';
    await store.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`store:${store.storeId}`).emit('store:rejected', {
        storeId: store.storeId,
        status: 'rejected',
      });
      io.emit('store:status_updated', {
        storeId: store.storeId,
        status: 'rejected',
      });
    }

    res.json({
      success: true,
      message: `Store ${store.name} rejected.`,
      store,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update store hardware mic or status
router.patch('/:id/mic', async (req, res) => {
  try {
    const { activeMic, availableMics } = req.body;
    const store = await Store.findOne({ storeId: req.params.id });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    if (activeMic) store.systemInfo.activeMic = activeMic;
    if (availableMics) store.systemInfo.availableMics = availableMics;
    store.lastSeenAt = new Date();
    await store.save();

    res.json({ success: true, store });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
