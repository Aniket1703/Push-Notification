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

// Routes

// Register Device Token
app.post('/register-token', async (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid token' });
  }

  await Device.updateOne({ token }, { token }, { upsert: true });
  res.json({ success: true });
});

// Send Notification
app.post('/notify', async (req, res) => {
  const { filename, status = 'success', error = '' } = req.body;

  const log = new PushLog({ filename, status, error });
  await log.save();

  const devices = await Device.find();
  await sendNotification(devices, filename, status, error);

  res.json({ success: true });
});

// Fetch Logs
app.get('/logs', async (req, res) => {
  const logs = await PushLog.find().sort({ timestamp: -1 });
  res.json(logs);
});

// Connect to MongoDB & Start Server
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI); // ✅ Clean and modern
    console.log(' MongoDB connected');

    app.listen(PORT, () => {
      console.log(` Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error(' MongoDB connection failed:', err.message);
    process.exit(1); // Exit if DB fails to connect
  }
}

startServer();
