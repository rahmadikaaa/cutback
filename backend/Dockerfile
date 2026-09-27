# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package.json package-lock.json ./
# Install ALL dependencies (including devDependencies) to build TypeScript
RUN npm ci

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Prune devDependencies so we only copy production modules to the runner stage
RUN npm prune --omit=dev

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-slim AS runner

# Security: run as non-root user
RUN groupadd -r cutback && useradd -r -g cutback cutback

WORKDIR /app

# Copy production node_modules from builder (pruned above)
COPY --from=builder /app/node_modules ./node_modules

# Copy compiled output only
COPY --from=builder /app/dist ./dist

# Cloud Run injects PORT automatically; default to 3000 for local testing
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

USER cutback

CMD ["node", "dist/server.js"]
