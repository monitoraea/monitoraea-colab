FROM node:18.19-buster

COPY packages /app/packages

WORKDIR /app/packages/courier
RUN pnpm i
WORKDIR /app/packages/backend
RUN pnpm i
CMD ["node","index.js"]