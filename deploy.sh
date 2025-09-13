#!/bin/bash

echo "🚀 Deploying Token Webhook Server to Railway..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: Token webhook server"
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📥 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "🔐 Logging into Railway..."
railway login

# Deploy
echo "🚀 Deploying to Railway..."
railway up

# Set environment variables
echo "⚙️  Setting environment variables..."
railway variables set KEY_ID="F24AAF7D-8CE8-4425-99A2-1C89CD24D954"
railway variables set API_KEY="your-secret-api-key-$(date +%s)"
railway variables set CRON_SECRET="your-cron-secret-$(date +%s)"

echo "✅ Deployment complete!"
echo "📡 Your server URL will be shown above"
echo "🔧 Don't forget to:"
echo "   1. Set WEBHOOK_URL in Railway dashboard"
echo "   2. Update GitHub secrets for auto-refresh"
echo "   3. Test your API endpoints"
