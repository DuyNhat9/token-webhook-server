FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Add debug output
RUN echo "Dockerfile build completed successfully"

# Start the application with debug output
CMD ["sh", "-c", "echo 'Starting webhook server...' && node webhook-server-auto-railway.js"]
