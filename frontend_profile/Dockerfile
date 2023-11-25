FROM node:16-alpine

WORKDIR /app

# COPY package.json .
# COPY package-lock.json .
COPY . .
RUN npm ci

EXPOSE 3000

ENTRYPOINT npm run start

