#!/bin/bash

echo "🚀 Deploying fixed server to Railway..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway login status..."
railway whoami || railway login

# Force deploy with new file
echo "📦 Deploying fixed server..."
railway up --detach

# Wait a moment for deployment
echo "⏳ Waiting for deployment..."
sleep 10

# Check logs
echo "📊 Checking deployment logs..."
railway logs --tail 20

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at the Railway URL"
echo "🔍 Check health: curl https://your-app.railway.app/health"
