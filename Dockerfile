FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY real-token-server.js .

EXPOSE 3000

CMD ["node", "real-token-server.js"]