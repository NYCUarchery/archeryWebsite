FROM node:20-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm ci
COPY . .

EXPOSE 3000

RUN npm run build
ENTRYPOINT npm run preview
