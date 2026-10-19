const mongoose = require('mongoose');

const AdminUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: 'Admin',
    },
    role: {
      type: String,
      enum: ['super_admin', 'store_admin'],
      default: 'super_admin',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AdminUser', AdminUserSchema);
