const mongoose = require('mongoose');

const PushLog = mongoose.model('PushLog', new mongoose.Schema({
  filename: String,
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  error: String,
  timestamp: Date
}));


const Device = mongoose.model('Device', new mongoose.Schema({
  token: String
}));

module.exports = { PushLog, Device };

