#!/bin/bash

echo "🚀 Quick Deploy Enhanced Token Server"

# Update package.json to use enhanced server as main
echo "📝 Updating package.json..."
sed -i '' 's/"main": "smart-token-server.js"/"main": "webhook-server-enhanced.js"/' package.json

# Create railway.json if not exists
if [ ! -f "railway.json" ]; then
    echo "📦 Creating railway.json..."
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

# Create optimized Dockerfile
echo "🐳 Creating optimized Dockerfile..."
cat > Dockerfile << 'EOF'
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer environment
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CONTAINERIZED=1

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

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start enhanced server
CMD ["node", "webhook-server-enhanced.js"]
EOF

echo "✅ Files prepared for deployment"

# Check if Railway CLI is available
if command -v railway &> /dev/null; then
    echo "🚀 Deploying with Railway CLI..."
    railway up
else
    echo "📋 Manual deployment steps:"
    echo "1. Push to GitHub:"
    echo "   git add ."
    echo "   git commit -m 'Deploy enhanced token server'"
    echo "   git push origin main"
    echo ""
    echo "2. Go to Railway dashboard:"
    echo "   - Connect your GitHub repo"
    echo "   - Set environment variables"
    echo "   - Deploy"
fi

echo ""
echo "🎯 Environment Variables to set in Railway:"
echo "KEY_ID=F24AAF7D-8CE8-4425-99A2-1C89CD24D954"
echo "API_KEY=your-secret-api-key-123"
echo "WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url"
echo "TELEGRAM_BOT_TOKEN=your-telegram-bot-token"
echo "TELEGRAM_CHAT_ID=your-telegram-chat-id"
echo ""
echo "✅ Enhanced Token Server ready for deployment!"
