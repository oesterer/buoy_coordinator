FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --workspaces --include-workspace-root

COPY backend backend
RUN npm run build --workspace backend

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
RUN npm ci --workspace backend --omit=dev

COPY --from=build /app/backend/dist backend/dist

EXPOSE 4000
CMD ["node", "backend/dist/server.js"]
