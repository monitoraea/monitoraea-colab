FROM node:14.19-slim

ENV NODE_OPTIONS=--max-old-space-size=8192

COPY packages /app/packages

COPY package.json /app

COPY lerna.json /app

WORKDIR /app

RUN npm install --global lerna@6.6.2
RUN lerna bootstrap

COPY packages/front/node_modules/ckeditor5-custom-build/build/ /app/packages/front/node_modules/ckeditor5-custom-build/build/

RUN lerna run build

WORKDIR /app/packages/backend
CMD ["node","index.js"]