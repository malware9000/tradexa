# -------- Stage 1: build the whole monorepo --------
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++ git openssl

COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY apps apps
COPY services services
COPY packages packages

# Install all workspace deps
# Prisma generate runs as part of @prisma/client postinstall
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?sslmode=require" npm install

# Generate Prisma client explicitly (schema needs DATABASE_URL even for generate)
RUN npm run generate --workspace packages/database

# Build workspace packages first (compile src/*.ts -> dist/*.js for runtime)
RUN npm run build --workspace packages/types && \
    npm run build --workspace packages/shared && \
    npm run build --workspace packages/validation && \
    npm run build --workspace packages/database

# Build the API (compiles services/api -> dist)
RUN npm run build --workspace services/api

# -------- Stage 2: production runtime --------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

# Copy the full monorepo (workspace packages are symlinked in node_modules)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/api/dist ./services/api/dist
COPY --from=builder /app/services/api/package.json ./services/api/package.json
COPY --from=builder /app/packages ./packages

EXPOSE 3000
WORKDIR /app/services/api
CMD ["node", "dist/main.js"]
