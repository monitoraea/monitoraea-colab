FROM node:14.19-alpine
RUN apk --no-cache add git

ENV NODE_OPTIONS=--max-old-space-size=8192

COPY packages /app/packages

COPY package.json /app

COPY lerna.json /app

WORKDIR /app

RUN npm install --global lerna@6.6.2
RUN lerna bootstrap

COPY packages/front/node_modules/ckeditor5-custom-build/build/ /app/packages/front/node_modules/ckeditor5-custom-build/build/