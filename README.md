
# 📡 Push Notification Backend with Node.js & Firebase

This project is a lightweight Node.js backend for sending push notifications using Firebase Cloud Messaging (FCM). It includes secure device token registration, message dispatching to devices, and a persistent log of all push activity using MongoDB.

---

## ⚙️ Features

- 🔐 Secure FCM integration via Google JWT Service Account
- 📲 Device token registration and storage
- 📩 Send push notifications to all registered devices or a specific token
- 🧾 Logs all notification attempts in MongoDB
- 🌐 Easily deployable on services like Render or Railway

---

## 📁 Project Structure

```
.
├── models.js             # Mongoose schemas for PushLog and Device
├── notifications.js      # FCM messaging logic using Google JWT
├── index.js              # Express app entry point and API routes
├── .env                  # Environment variables
└── package.json
```

---

## 🔧 Prerequisites

- Node.js ≥ 14
- MongoDB instance (local or cloud)
- Firebase project with FCM enabled
- Service account JSON from Firebase

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Aniket1703/Push-Notification.git
cd Push-Notification
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a .env file in the root directory:

.env
```env
PORT=3001
MONGO_URI=your_mongodb_connection_string
GCJ=your_base64_encoded_service_account_json
```

To generate GCJ: (Download private key json file from your firebase project encode it in base64)
```bash
base64 your-service-account.json
```

Paste the output (one line) into the .env file.

---

## ▶️ Running the Server

Start the server with:

```bash
node index.js
```



The server will start at http://localhost:3001

---

## 📬 API Endpoints

| Method | Endpoint            | Description                             |
|--------|---------------------|-----------------------------------------|
| POST   | /register-token     | Register a device token                 |
| POST   | /notify             | Send notification to all devices        |
| POST   | /test-notify        | Send notification to a specific token   |
| GET    | /logs               | Get all push notification logs          |

---

## 📦 Example POST Requests

### Register a Token

POST /register-token

```json
{
  "token": "DEVICE_FCM_TOKEN"
}
```

---

### Send Notification to All Devices

POST /notify

```json
{
  "filename": "upload.js",
  "status": "success",
  "error": ""
}
```

---

### Send Notification to Specific Device

POST /test-notify

```json
{
  "filename": "script.js",
  "status": "failed",
  "error": "File not found",
  "token": "DEVICE_FCM_TOKEN"
}
```

---

## 🧾 MongoDB Collections

- Devices: Stores unique device tokens.
- PushLogs: Stores each push attempt with timestamp, status, and error.

---

## 🛡️ Security

- All FCM access is authorized using a Google JWT created from a base64-encoded Firebase service account.
- Tokens are validated before storing.

---

## 📄 License

MIT License © 2025 Your Name
