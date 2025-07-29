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


const reminderSchema = new mongoose.Schema({
  token: { type: String, required: true },
  title: String,
  body: String,
  time: { type: Date, required: true }, // When to send
}, { versionKey: false });


//  Models
const PushLog = mongoose.model('PushLog', pushLogSchema);
const Device = mongoose.model('Device', deviceSchema);
const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = { PushLog, Device, Reminder };
