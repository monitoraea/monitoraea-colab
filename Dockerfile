FROM node:18.19-buster

COPY forms /app/forms
COPY packages /app/packages
RUN npm install --global pnpm
WORKDIR /app/packages/backend
RUN pnpm i
CMD ["node","index.js"]