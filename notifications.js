const { JWT } = require('google-auth-library');
const fetch = require('node-fetch');

const serviceAccount = JSON.parse(
  Buffer.from(process.env.GCJ, 'base64').toString('utf-8')
);

const jwtClient = new JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
});

const FCM_URL = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;

async function sendNotification(devices = [], filename, status = 'success', errorMsg = '') {
  const results = [];

  if (!devices || devices.length === 0) {
    return { success: false, message: 'No devices to send notification to', results };
  }

  const bodyText =
    status === 'success'
      ? `File pushed: ${filename}`
      : `Push failed: ${filename}`;

  const baseMessage = {
    notification: {
      title: 'Push Status',
      body: bodyText,
    },
    data: {
      filename,
      status,
      error: errorMsg || '',
    },
  };

  let accessToken;
  try {
    const credentials = await jwtClient.authorize();
    accessToken = credentials.access_token;
    if (!accessToken) throw new Error('No access token received');
  } catch (err) {
    return {
      success: false,
      message: 'Failed to authorize with Firebase',
      error: err.message,
      results,
    };
  }

  for (const device of devices) {
    const payload = {
      message: {
        ...baseMessage,
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
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.name) {
        results.push({
          token: device.token,
          success: true,
          message: 'Notification sent successfully',
          responseId: result.name,
        });
      } else {
        results.push({
          token: device.token,
          success: false,
          message: result.error?.message || 'Unknown error from FCM',
        });
      }
    } catch (err) {
      results.push({
        token: device.token,
        success: false,
        message: `Exception occurred: ${err.message}`,
      });
    }
  }

  const overallSuccess = results.every(r => r.success);
  return {
    success: overallSuccess,
    message: overallSuccess ? 'All notifications sent successfully' : 'Some notifications failed',
    results,
  };
}

module.exports = { sendNotification };
