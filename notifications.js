const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const fetch = require('node-fetch');

// ✅ FIX: decode properly before parsing
const serviceAccount = JSON.parse(
  Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, 'base64').toString('utf-8')
);

// Now you can create JWT client
const jwtClient = new JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
});

const FCM_URL = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;

async function sendNotification(devices, filename, status, errorMsg) {
  const bodyText =
    status === 'success'
      ? `✅ File pushed: ${filename}`
      : `❌ Push failed: ${filename}`;

  const messagePayload = {
    message: {
      notification: {
        title: 'Push Status',
        body: bodyText,
      },
      data: {
        filename,
        status,
        error: errorMsg || '',
      },
    },
  };

  const accessToken = await jwtClient.authorize().then(res => res.access_token);

  for (const device of devices) {
    const finalPayload = {
      ...messagePayload,
      message: {
        ...messagePayload.message,
        token: device.token,
      },
    };

    try {
      const res = await fetch(FCM_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalPayload),
      });

      const result = await res.json();
      console.log(` Sent to ${device.token}:`, result);
    } catch (err) {
      console.error(` Error sending to ${device.token}:`, err.message);
    }
  }
}

module.exports = { sendNotification };
