FROM node:18.19-buster

COPY packages /app/packages

COPY package.json /app

COPY lerna.json /app

WORKDIR /app

RUN npm install --global lerna@6.6.2
RUN lerna bootstrap
RUN lerna run build

WORKDIR /app/packages/backend
CMD ["node","index.js"]