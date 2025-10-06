#!/bin/bash

echo "🚀 ULTIMATE DEPLOY - Using new server.js file..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway login status..."
railway whoami || railway login

# Force deploy with new server.js
echo "📦 Deploying with server.js..."
railway up --detach

# Wait for deployment
echo "⏳ Waiting for deployment to complete..."
sleep 20

# Check logs
echo "📊 Checking deployment logs..."
railway logs --tail 30

echo "✅ ULTIMATE DEPLOY complete!"
echo "🌐 Your app should be available at the Railway URL"
echo "🔍 Test with: curl https://your-app.railway.app/health"
echo "📱 Get token: curl https://your-app.railway.app/token"
