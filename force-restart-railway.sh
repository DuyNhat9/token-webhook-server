#!/bin/bash

echo "🔄 Force restarting Railway deployment..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway login status..."
railway whoami || railway login

# Force restart the service
echo "🔄 Restarting Railway service..."
railway restart

# Check logs
echo "📊 Checking logs..."
railway logs --tail 20

echo "✅ Restart completed!"
echo "🌐 Your app should be available at the Railway URL"
