const { Expo } = require('expo-server-sdk');
const expo = new Expo();

async function sendNotification(devices, filename, status, errorMsg) {
  const body =
    status === 'success'
      ? `✅ File pushed: ${filename}`
      : `❌ Push failed: ${filename}`;

  const data = { filename, status };
  if (errorMsg) data.error = errorMsg;

  const messages = devices.map(d => ({
    to: d.token,
    sound: 'default',
    body,
    data
  }));

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error('❌ Expo Push Error:', error);
    }
  }
}


module.exports = { sendNotification };