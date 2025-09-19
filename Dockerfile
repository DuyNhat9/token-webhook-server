FROM node:20-alpine

WORKDIR /app

# Install dependencies for Playwright
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
    xvfb \
    dbus \
    ttf-dejavu \
    fontconfig \
    mesa-gl \
    mesa-dri-gallium \
    libxcomposite \
    libxdamage \
    libxrandr \
    libxss \
    libgconf-2-4 \
    libxkbcommon \
    libgtk-3-0 \
    libasound2

# Set Playwright to use system Chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm install

# Install Playwright browsers
RUN npx playwright install chromium

COPY real-token-server.js .

EXPOSE 3000

CMD ["node", "real-token-server.js"]