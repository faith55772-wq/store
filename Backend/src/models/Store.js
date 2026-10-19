const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema(
  {
    storeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    contactPerson: {
      type: String,
      trim: true,
      default: 'Store Manager',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    isRecording: {
      type: Boolean,
      default: false,
    },
    systemInfo: {
      hostname: { type: String, default: '' },
      os: { type: String, default: 'Windows' },
      activeMic: { type: String, default: 'Default Microphone' },
      availableMics: [{ type: String }],
      clientVersion: { type: String, default: '1.0.0' },
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Store', StoreSchema);
