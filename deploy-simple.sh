#!/bin/bash

echo "🚀 Simple Railway Deploy..."

# Install Railway CLI if not installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo "Please run these commands manually:"
echo "1. railway login"
echo "2. railway link (or railway init)"
echo "3. railway up"
echo ""
echo "Or deploy via Railway Dashboard:"
echo "1. Go to railway.app"
echo "2. Connect your GitHub repo"
echo "3. Deploy!"

echo "✅ Server files are ready for deployment!"
