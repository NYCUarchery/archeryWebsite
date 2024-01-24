FROM node:16-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm ci
RUN npm run build
COPY . .

EXPOSE 3000

ENTRYPOINT npm run preview
