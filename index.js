require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sendNotification } = require('./notifications');
const { PushLog, Device } = require('./models');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Notify Route
app.post('/notify', async (req, res) => {
  const { filename, status = 'success', error = '' } = req.body;

  const log = new PushLog({ filename, status, error, timestamp: new Date() });
  await log.save();

  const devices = await Device.find();
  await sendNotification(devices, filename, status, error);

  res.send({ success: true });
});

// Register token
app.post('/register-token', async (req, res) => {
  const { token } = req.body;
  const { Expo } = require('expo-server-sdk');
  if (!Expo.isExpoPushToken(token)) return res.status(400).send('Invalid token');
  await Device.updateOne({ token }, { token }, { upsert: true });
  res.send({ success: true });
});

// Get logs
app.get('/logs', async (req, res) => {
  const logs = await PushLog.find().sort({ timestamp: -1 });
  res.send(logs);
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(process.env.PORT, () => console.log(`🚀 Backend running on http://localhost:${process.env.PORT}`)))
  .catch(err => console.error('❌ MongoDB connection error:', err));
