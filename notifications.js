const { google } = require('google-auth-library');
const fetch = require('node-fetch');

// Load and parse base64-encoded service account from environment variable
const serviceAccount = JSON.parse(
  Buffer.from(process.env.GCJ, 'base64').toString('utf8')
);

const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];
const PROJECT_ID = serviceAccount.project_id;

async function getAccessToken() {
  const client = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: SCOPES,
  });
  const tokens = await client.authorize();
  return tokens.access_token;
}

async function sendNotification(devices, filename, status, errorMsg) {
  const accessToken = await getAccessToken();

  const bodyText =
    status === 'success'
      ? ` File pushed: ${filename}`
      : ` Push failed: ${filename}`;

  for (const device of devices) {
    const payload = {
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
        token: device.token,
      },
    };

    try {
      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log(`Push sent to ${device.token}:`, result);
    } catch (error) {
      console.error(`Failed to send push to ${device.token}:`, error.message);
    }
  }
}

module.exports = { sendNotification };