#!/bin/bash

echo "🚀 Deploying Enhanced Token Server to Railway..."

# Check if we're in the right directory
if [ ! -f "webhook-server-enhanced.js" ]; then
    echo "❌ webhook-server-enhanced.js not found!"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "✅ Enhanced server file found"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "⚠️ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

echo "🔧 Railway CLI ready"

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
fi

echo "✅ Railway authentication confirmed"

# Create or update Railway project
echo "📦 Setting up Railway project..."

# Check if railway.json exists
if [ ! -f "railway.json" ]; then
    echo "Creating railway.json..."
    cat > railway.json << EOF
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF
fi

# Create Dockerfile for enhanced server
echo "🐳 Creating Dockerfile for enhanced server..."
cat > Dockerfile << 'EOF'
FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Start enhanced server
CMD ["node", "webhook-server-enhanced.js"]
EOF

echo "✅ Dockerfile created"

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "🎉 Deployment initiated!"
echo ""
echo "📋 Next steps:"
echo "1. Go to Railway dashboard to set environment variables:"
echo "   - KEY_ID=F24AAF7D-8CE8-4425-99A2-1C89CD24D954"
echo "   - API_KEY=your-secret-api-key-123"
echo "   - WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url"
echo "   - TELEGRAM_BOT_TOKEN=your-telegram-bot-token"
echo "   - TELEGRAM_CHAT_ID=your-telegram-chat-id"
echo ""
echo "2. Check deployment logs:"
echo "   railway logs"
echo ""
echo "3. Test the enhanced server:"
echo "   curl https://your-app.railway.app/health"
echo ""
echo "✅ Enhanced Token Server deployment complete!"
