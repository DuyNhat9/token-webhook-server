FROM node:20-alpine

WORKDIR /app

# Install minimal dependencies for Chromium
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev \
    bash \
    dbus \
    ttf-dejavu \
    fontconfig \
    dumb-init

# Set Playwright to use system Chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm install

# Install Playwright browsers
RUN npx playwright install chromium

# Set environment variables for containerized environment
ENV CONTAINERIZED=1
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV CHROME_BIN=/usr/bin/chromium-browser

COPY . .

EXPOSE 3000

# Use dumb-init as entrypoint to handle zombie processes
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "real-token-server-minimal.js"]