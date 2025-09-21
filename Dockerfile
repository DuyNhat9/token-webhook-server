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
    fontconfig

# Set Playwright to use system Chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm install

# Install Playwright browsers
RUN npx playwright install chromium

COPY real-token-server-minimal.js .

EXPOSE 3000

CMD ["node", "real-token-server-minimal.js"]