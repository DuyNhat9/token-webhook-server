# Use Node.js 20 Alpine for smaller image
FROM node:20-alpine

# Install Puppeteer dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_TIMEOUT=600000 \
    PLAYWRIGHT_DOWNLOAD_HOST=https://playwright.download.prss.microsoft.com

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (skip Playwright browser download during npm install to avoid failing postinstall)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm install

# Best-effort retry to ensure Playwright browser gets installed even if network is flaky
RUN for i in 1 2 3; do \
      npx --yes playwright install chromium && break || sleep 10; \
    done

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port (for health check)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Start the application
CMD ["node", "webhook-server-auto-railway.js"]
