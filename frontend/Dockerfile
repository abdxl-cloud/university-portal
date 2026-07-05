FROM node:20-alpine AS development-dependencies-env
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

FROM node:20-alpine AS production-dependencies-env
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS build-env
WORKDIR /app
COPY frontend ./frontend
COPY prototype ./prototype
COPY --from=development-dependencies-env /app/frontend/node_modules /app/frontend/node_modules
WORKDIR /app/frontend
RUN npm run build

FROM node:20-alpine
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
COPY --from=production-dependencies-env /app/frontend/node_modules ./node_modules
COPY --from=build-env /app/frontend/build ./build
CMD ["npm", "run", "start"]
