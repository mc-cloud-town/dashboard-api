FROM node:lts-alpine AS base

WORKDIR /app

COPY . .

RUN yarn
RUN yarn build

FROM node:lts-alpine AS production

WORKDIR /app
COPY --from=base /app/dist ./dist

EXPOSE 8000
COPY ./package.json .

CMD ["yarn", "start"]
