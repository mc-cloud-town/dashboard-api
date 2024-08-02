# Stage 1: Build
FROM node:lts-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source files and build the application
COPY . .
RUN yarn build

# Stage 2: Production
FROM node:lts-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Copy only necessary files for production
COPY --from=build /app/dist/index.js ./dist/index.js

# Expose the port the app runs on
EXPOSE 8000

ENV NODE_ENV=production
# Start the application
CMD ["yarn", "start"]
