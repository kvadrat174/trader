FROM node:14-alpine

WORKDIR /app

RUN apk add build-base
RUN npm i nodemon  @nestjs/schematics @nestjs/cli -g

COPY ./scripts /scripts

RUN chmod +x -R /scripts

