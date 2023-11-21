FROM node:14-alpine

WORKDIR /app
COPY package.json .
# COPY package-lock.json .
RUN npm i
RUN npm i -g serve

COPY . .
RUN npm run build
ENTRYPOINT npm run dev -- --host
EXPOSE 3000