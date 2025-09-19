FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY ultra-simple-token.js .

EXPOSE 3000

CMD ["node", "ultra-simple-token.js"]