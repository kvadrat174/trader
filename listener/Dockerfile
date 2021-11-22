FROM node:12.13-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install -g nodemon

RUN npm install

COPY . .


