# 🚀 Token Webhook Server

Automated token retrieval system that runs on Railway and provides API endpoints to get tokens remotely.

## 🎯 Features

- ✅ **Runs 24/7 on Railway** (free tier)
- ✅ **Automatic token refresh** every 2 hours
- ✅ **REST API** to get tokens remotely
- ✅ **Discord notifications** when tokens are retrieved
- ✅ **No local setup required**

## 🚀 Quick Deploy to Railway

### 1. Fork this repository
Click the "Fork" button on GitHub

### 2. Deploy on Railway
1. Go to [Railway.app](https://railway.app)
2. Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your forked repository
5. Railway will automatically deploy

### 3. Set Environment Variables
In Railway dashboard, go to Variables tab and add:

```
KEY_ID=F24AAF7D-8CE8-4425-99A2-1C89CD24D954
API_KEY=your-secret-api-key-123
WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url
CRON_SECRET=your-cron-secret-456
```

### 4. Get your server URL
Railway will provide a URL like: `https://your-app.railway.app`

## 📱 Using the API

### Get current token:
```bash
curl https://your-app.railway.app/token
```

### Check server status:
```bash
curl https://your-app.railway.app/status
```

### Force refresh token:
```bash
curl -X POST https://your-app.railway.app/refresh \
     -H "Content-Type: application/json" \
     -d '{"apiKey": "your-secret-api-key-123"}'
```

## 🔔 Discord Notifications

1. Create a Discord webhook in your server
2. Copy the webhook URL
3. Set `WEBHOOK_URL` in Railway environment variables

You'll get notifications when:
- ✅ Token retrieved successfully
- ❌ Errors occur
- 🔄 Server starts/stops

## ⏰ Auto-refresh Setup

1. Go to your GitHub repository
2. Go to Settings → Secrets and variables → Actions
3. Add these secrets:
   - `SERVER_URL`: Your Railway app URL
   - `CRON_SECRET`: Same as in Railway variables

The GitHub Action will automatically refresh tokens every 2 hours.

## 🛡️ Security

- API endpoints are protected with API keys
- Environment variables are encrypted
- CORS is enabled for all origins

## 📊 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |
| GET | `/token` | Get current token | No |
| GET | `/status` | Server status | No |
| POST | `/refresh` | Force refresh token | Yes (API key) |
| POST | `/auto-refresh` | Auto refresh (cron) | Yes (secret) |

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Set environment variables
cp env.example .env
# Edit .env with your values

# Run server
npm start

# Test endpoints
curl http://localhost:3000/health
```

## 📁 Project Structure

```
├── webhook-server.js      # Main server
├── client-request.js      # Client to request tokens
├── railway.json          # Railway deployment config
├── .github/workflows/    # GitHub Actions
└── README.md            # This file
```

## 🎉 Result

After deployment:
- ✅ Server runs 24/7 on Railway
- ✅ Tokens are automatically refreshed
- ✅ API is ready to serve tokens
- ✅ Discord notifications work
- ✅ No local setup required

**Just call the API when you need a token!**

## 🆘 Support

If you encounter issues:
1. Check Railway logs
2. Verify environment variables
3. Test API endpoints
4. Check Discord webhook URL

## 📄 License

MIT License - feel free to use and modify!# token-webhook-server
# Auto token server deployment
# Force Railway redeploy
# Force Railway to use nixpacks.toml
