FROM node:20.19-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .

EXPOSE 3000

CMD ["node", "main.js"]