#!/bin/bash

echo "🚀 Deploying Optimized Token Server..."

# Copy optimized server as main
cp optimized-server.py smart-token-server.py

# Update package.json for optimized server
cat > package.json << EOF
{
  "name": "optimized-token-server",
  "version": "2.0.0",
  "description": "Optimized Token Server with thread management",
  "main": "smart-token-server.py",
  "scripts": {
    "start": "python3 smart-token-server.py"
  },
  "dependencies": {
    "flask": "^3.0.0",
    "selenium": "^4.15.2",
    "requests": "^2.31.0"
  },
  "keywords": [
    "token",
    "selenium",
    "optimized",
    "thread-safe"
  ],
  "author": "Optimized Token System",
  "license": "MIT"
}
EOF

# Update nixpacks.toml for optimized server
cat > nixpacks.toml << EOF
providers = ["python"]

[phases.setup]
nixPkgs = ["google-chrome", "chromium", "libnss3", "libatk1.0-0", "libatk-bridge2.0-0", "libcups2", "libgbm1", "libasound2t64", "libpangocairo-1.0-0", "libxss1", "libgtk-3-0", "libxshmfence1", "libglu1"]

[phases.install]
cmds = ["pip install --no-cache-dir -r requirements.txt"]

[phases.build]
cmds = ["echo 'Build completed - optimized server ready'"]

[start]
cmd = "python3 smart-token-server.py"

[variables]
AUTO_REFRESH = "true"
AUTO_REFRESH_INTERVAL = "600"
EOF

# Update railway.json
cat > railway.json << EOF
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python3 smart-token-server.py",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
EOF

echo "✅ Configuration files updated"
echo "📦 Installing dependencies..."

# Install dependencies locally for testing
pip install -r requirements.txt

echo "🧪 Testing optimized server locally..."
echo "   Run: python3 optimized-server.py"
echo "   Or: python3 smart-token-server.py"

echo "🚀 Ready to deploy to Railway!"
echo "📡 Endpoints:"
echo "   GET  /health - Health check"
echo "   GET  /token - Get current token"
echo "   GET  /status - Get server status"
echo "   POST /fetch - Fetch new token"
echo "   POST /auto-refresh - Start auto-refresh"
echo "   DELETE /auto-refresh - Stop auto-refresh"

echo ""
echo "🔧 Key improvements:"
echo "   ✅ Thread pool management (max 2 workers)"
echo "   ✅ Cooldown handling"
echo "   ✅ Optimized browser settings"
echo "   ✅ Better error handling"
echo "   ✅ Increased refresh interval (10 minutes)"
echo "   ✅ Resource cleanup"
