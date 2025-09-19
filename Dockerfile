FROM node:20-alpine

WORKDIR /app

COPY working-server.js .

EXPOSE 3000

CMD ["node", "working-server.js"]
