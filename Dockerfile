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
    dbus-x11 \
    ttf-dejavu \
    fontconfig \
    dumb-init \
    xvfb \
    mesa-dri-gallium

# Set Playwright to use system Chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm install

# Skip Playwright browser installation - using system Chromium

# Set environment variables for containerized environment
ENV CONTAINERIZED=1
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV DISPLAY=:99
ENV DBUS_SESSION_BUS_ADDRESS=/dev/null
ENV XDG_RUNTIME_DIR=/tmp
ENV LIBGL_ALWAYS_SOFTWARE=1

COPY . .

EXPOSE 3000

# Use dumb-init as entrypoint to handle zombie processes
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "railway-token-server.js"]