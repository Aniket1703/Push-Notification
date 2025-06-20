const mongoose = require('mongoose');

//  PushLog Schema
const pushLogSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success',
    },
    error: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

//  Device Schema
const deviceSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
  },
  { versionKey: false }
);

//  Models
const PushLog = mongoose.model('PushLog', pushLogSchema);
const Device = mongoose.model('Device', deviceSchema);

module.exports = { PushLog, Device };
