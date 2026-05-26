FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY mock ./mock

EXPOSE 3000

CMD ["node", "mock/bank-server.js"]
