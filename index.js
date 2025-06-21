require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const { sendNotification } = require('./notifications');
const { PushLog, Device } = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Register Device Token
app.post('/register-token', async (req, res) => {
  const { token } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid token' });
  }

  try {
    await Device.updateOne({ token }, { token }, { upsert: true });
    return res.status(200).json({ success: true, message: 'Token registered' });
  } catch (err) {
    console.error('Error registering token:', err);
    return res.status(500).json({ success: false, error: 'Failed to register token' });
  }
});

// Send Notification
app.post('/notify', async (req, res) => {
  const { filename, status = 'success', error = '' } = req.body;

  if (!filename) {
    return res.status(400).json({ success: false, error: 'Filename is required' });
  }

  try {
    const log = new PushLog({ filename, status, error});
    await log.save();

    const devices = await Device.find();
    if (devices.length === 0) {
      return res.status(404).json({ success: false, error: 'No devices registered' });
    }

    const sendResult = await sendNotification(devices, filename, status, error);

    if (sendResult.failed && sendResult.failed.length > 0) {
      return res.status(207).json({
        success: false,
        message: 'Some notifications failed',
        failed: sendResult.failed
      });
    }

    return res.status(200).json({ success: true, message: 'Notifications sent successfully' });
  } catch (err) {
    console.error('Notification error:', err);
    return res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

// Fetch Logs
app.get('/logs', async (req, res) => {
  try {
    const logs = await PushLog.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    console.error('Failed to fetch logs:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
});

app.post('/test-notify', async (req, res) => {
  const { filename, status = 'success', error = '', token } = req.body;
  if (!token) return res.status(400).json({ success: false, message: 'Token is required' });

  const log = new PushLog({ filename, status, error });
  await log.save();

  await sendNotification([{ token }], filename, status, error);
  res.json({ success: true });
});

// Connect to MongoDB & Start Server
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running `);
    });
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

startServer();
