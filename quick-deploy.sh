#!/bin/bash

echo "🚀 Quick Deploy Script for Railway"
echo "=================================="

# Navigate to project directory
cd /Users/davidtran/Desktop/k

echo "📁 Current directory: $(pwd)"

# Add optimized files
echo "📦 Adding optimized files..."
git add Dockerfile.optimized nixpacks.toml

# Commit changes
echo "💾 Committing changes..."
git commit -m "🔧 Optimize build configuration to avoid timeout

- Add optimized Dockerfile for faster builds
- Simplify nixpacks.toml configuration
- Remove heavy Chromium installation from build
- Use system Chromium instead of downloading
- Reduce build time and avoid timeout issues"

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push origin main

echo "✅ Deploy triggered!"
echo "🎯 Railway will now use optimized build configuration"
echo "⏰ Expected build time: 2-3 minutes (much faster)"
echo ""
echo "📊 Check Railway dashboard for deployment progress"
