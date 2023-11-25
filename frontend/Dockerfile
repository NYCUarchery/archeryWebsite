FROM node:16-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm ci
COPY src src
COPY public public
COPY tsconfig.json .

RUN npm run build
RUN npm install -g serve
ENTRYPOINT serve build

EXPOSE 3000

