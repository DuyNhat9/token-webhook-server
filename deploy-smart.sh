#!/bin/bash

echo "🚀 Deploying Smart Token Server..."

# Copy package.json
cp smart-package.json package.json

# Update nixpacks.toml for smart server
cat > nixpacks.toml << EOF
providers = ["nodejs"]

[phases.setup]
nixPkgs = ["chromium", "libnss3", "libatk1.0-0", "libatk-bridge2.0-0", "libcups2", "libgbm1", "libasound2t64", "libpangocairo-1.0-0", "libxss1", "libgtk-3-0", "libxshmfence1", "libglu1"]

[phases.install]
cmds = ["npm install --omit=dev --no-optional", "mkdir -p /tmp/puppeteer-cache"]

[phases.build]
cmds = ["echo 'Build completed - skipping Chromium download'", "echo 'Chromium will be downloaded on first run'"]

[start]
cmd = "node smart-token-server.js"

[variables]
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true"
PUPPETEER_CACHE_DIR = "/tmp/puppeteer-cache"
PUPPETEER_EXECUTABLE_PATH = "/usr/bin/chromium"
EOF

# Update railway.json
cat > railway.json << EOF
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node smart-token-server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

echo "✅ Configuration files updated"
echo "📦 Installing dependencies..."

# Install dependencies locally for testing
npm install

echo "🧪 Testing smart system locally..."
echo "   Run: node test-smart-system.js"
echo "   Or: npm test"

echo "🚀 Deploying to Railway..."
railway up --detach

echo "✅ Smart Token Server deployed!"
echo "📡 Endpoints:"
echo "   GET  /health - Health check"
echo "   GET  /token - Get current token"
echo "   GET  /status - Get server status"
echo "   POST /refresh - Force refresh token"
echo "   POST /auto-refresh - Auto refresh (for cron)"
echo "   POST /send-token - Send token to Telegram"
