require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const { sendNotification } = require('./notifications');
const { PushLog, Device, Reminder } = require('./models');

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
    // Save to logs
    const log = new PushLog({ filename, status, error });
    await log.save();

    // Get devices
    const devices = await Device.find();
    if (devices.length === 0) {
      return res.status(404).json({ success: false, error: 'No devices registered' });
    }

    // Build title & body for notification
    const title = 'Push Status';
    const body =
      status === 'success'
        ? `File pushed: ${filename}`
        : `Push failed: ${filename}`;

    // Send notification
    const sendResult = await sendNotification(devices, title, body, {
      filename,
      status,
      error,
    });

    // Check if any failed
    const failed = sendResult.results.filter(r => !r.success);

    if (failed.length > 0) {
      return res.status(207).json({
        success: false,
        message: 'Some notifications failed',
        failed,
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

app.post('/schedule-reminder', async (req, res) => {
  const { token, title, body, delayInMs } = req.body;

  if (!token || !title || !body || !delayInMs) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  const remindAt = new Date(Date.now() + delayInMs);
  await Reminder.create({ token, title, body, time: remindAt });

  res.json({ success: true, message: 'Reminder scheduled successfully' });
});

app.post('/send-due-reminders', async (req, res) => {
  try {
    const now = new Date();

    const dueReminders = await Reminder.find({ time: { $lte: now } });
    if (dueReminders.length === 0) {
      return res.status(200).json({ success: true, message: 'No due reminders at this time.' });
    }

    const sendResults = [];

    for (const r of dueReminders) {
      const result = await sendNotification(
        [{ token: r.token }],
        r.title || 'Reminder',
        r.body || '',
        {} // Optional data object
      );
      sendResults.push(result);
    }

    const idsToDelete = dueReminders.map(r => r._id);
    await Reminder.deleteMany({ _id: { $in: idsToDelete } });

    res.json({
      success: true,
      sentCount: sendResults.length,
      message: 'Reminders sent and cleared successfully.',
      results: sendResults,
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    res.status(500).json({ success: false, error: 'Failed to send reminders' });
  }
});



// Connect to MongoDB & Start Server
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI); // No need for extra options
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
