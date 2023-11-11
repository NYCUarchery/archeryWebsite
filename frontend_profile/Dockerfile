FROM node:16-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm ci
RUN npm install -g serve

COPY public public
COPY tsconfig.json .
COPY src src

RUN npm run build
ENTRYPOINT serve build

EXPOSE 3000

