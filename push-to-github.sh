#!/bin/bash

echo "🚀 Pushing updated code to GitHub for Railway deployment..."

# Navigate to project directory
cd /Users/davidtran/Desktop/k

# Check git status
echo "📋 Checking git status..."
git status

# Add all files
echo "📁 Adding files to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "🔧 Update modal handling for new notification popup

- Add modal detection and closing logic to all token scripts
- Update get-token-smart.js with modal handling
- Update railway-token-server.js with robust modal strategies  
- Update webhook-server.js with modal support
- Update auto-token.js for continuous monitoring
- Add test scripts for modal handling verification
- Add comprehensive modal update documentation

This update ensures all scripts can handle the new notification modal
that appears on the website before accessing the token functionality."

# Set remote URL
echo "🔗 Setting remote URL..."
git remote set-url origin https://github.com/DuyNhat9/token-webhook-server.git

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push -u origin main

# Check if push was successful
if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo "🚀 Railway will automatically deploy the updated code"
    echo "📊 Check Railway dashboard for deployment status"
else
    echo "❌ Failed to push to GitHub"
    echo "🔧 Please check your internet connection and try again"
    echo "📋 Alternative: Use GitHub Desktop or web interface"
fi

echo "🎯 Next steps:"
echo "1. Check Railway dashboard for deployment"
echo "2. Test endpoints: curl https://your-app.railway.app/health"
echo "3. Verify modal handling is working"
