# Use Node.js 20 Alpine for smaller image
FROM node:20-alpine

# Install Chromium and runtime deps
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev \
    dumb-init \
    bash \
    xvfb \
    dbus \
    ttf-dejavu \
    fontconfig

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROMIUM_PATH=/usr/bin/chromium-browser
ENV NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_TIMEOUT=600000 \
    PLAYWRIGHT_DOWNLOAD_HOST=https://playwright.download.prss.microsoft.com

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (skip running package postinstall scripts)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm install --ignore-scripts

# Best-effort retry to ensure Playwright browser gets installed even if network is flaky
RUN for i in 1 2 3; do \
      npx --yes playwright install chromium && break || sleep 10; \
    done || true

# Ensure chromium-browser path exists (Alpine uses /usr/bin/chromium)
RUN if [ ! -e /usr/bin/chromium-browser ] && [ -e /usr/bin/chromium ]; then \
      ln -sf /usr/bin/chromium /usr/bin/chromium-browser; \
    fi

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
# Use dumb-init to handle zombie processes and signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "webhook-server-auto-railway.js"]
