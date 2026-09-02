# -------- Stage 1: build the whole monorepo --------
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++ git openssl && \
    npm install -g npm@10

COPY package.json package-lock.json* ./
COPY apps apps
COPY services services
COPY packages packages

# Install all workspace deps (postinstall of @prisma/client runs prisma generate)
RUN npm install

# Generate the Prisma client explicitly (relative to the database package)
RUN npm run generate --workspace packages/database

# Build the API (compiles services/api -> dist)
RUN npm run build --workspace services/api

# -------- Stage 2: production runtime --------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

# Copy production node_modules + built output
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/api/dist ./services/api/dist
COPY --from=builder /app/packages ./packages

# Rebuild the native argon2 module against the runner image
RUN npm rebuild argon2

EXPOSE 3000
WORKDIR /app/services/api
CMD ["node", "dist/main.js"]
