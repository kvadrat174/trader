FROM node:14.16.0-alpine3.12

RUN rm -rf /var/cache/apk/* && \
    rm -rf /tmp/*

RUN apk update

RUN apk add git bash build-base openssh

RUN npm i -g @nestjs/cli prettier