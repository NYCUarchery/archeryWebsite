FROM node:20-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm ci
COPY . .

ARG NEXT_PUBLIC_API_BASE_PATH=/api/
ENV NEXT_PUBLIC_API_BASE_PATH=$NEXT_PUBLIC_API_BASE_PATH

EXPOSE 3000

RUN npm run build
ENTRYPOINT npm run start
