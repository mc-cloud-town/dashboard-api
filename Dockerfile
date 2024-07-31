FROM node:lts-alpine AS base

WORKDIR /app

COPY ./package.json .
COPY ./yarn.lock .

RUN yarn
RUN yarn build

FROM node:lts-alpine AS production

WORKDIR /app

COPY --from=base /app/dist ./dist
COPY . .
RUN yarn install --production

EXPOSE 8000

CMD ["yarn", "start"]
