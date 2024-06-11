FROM node:18.19-buster
RUN apk --no-cache add git

COPY packages /app/packages

COPY package.json /app

COPY lerna.json /app

WORKDIR /app

RUN npm install --global lerna@6.6.2
RUN lerna bootstrap