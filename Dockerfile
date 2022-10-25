FROM node:19-alpine

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

USER root
WORKDIR /home/app

RUN apk add curl

RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm

COPY pnpm-lock.yaml .

RUN pnpm fetch

ADD . .

RUN pnpm install -r --offline

ENV NODE_ENV=production

EXPOSE 3000

CMD pnpm start
