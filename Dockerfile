# ── Stage 1: Build ─────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (including devDependencies)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build frontend (Vite → dist/) and backend (esbuild → dist-server/)
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# Copy package files and install ONLY production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy build outputs from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Cloud Run uses PORT env var
ENV PORT=8080
EXPOSE 8080

# Start Express server
CMD ["node", "dist-server/index.js"]
