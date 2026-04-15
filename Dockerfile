# ==============================================================================
# Stage 1 — Build React frontend
# ==============================================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /build

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
RUN npm run build
# Output: /build/dist

# ==============================================================================
# Stage 2 — Backend + bundled frontend (single container, single port)
# The Express server serves both the REST API (/api/*) and the built React app.
# ==============================================================================
FROM node:20-bookworm-slim
WORKDIR /app

# System deps: openssl (Prisma) + ca-certificates (HTTPS requests from Playwright)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install backend dependencies
COPY backend/package*.json ./
RUN npm install

# Install Playwright + Chromium (used by the test execution engine)
RUN npx playwright install --with-deps chromium

# Copy backend source & database schema
COPY backend/src ./src
COPY backend/prisma ./prisma

# Copy built React frontend → Express serves it as static files
COPY --from=frontend-builder /build/dist ./public

# Generate Prisma client (uses ./prisma/schema.prisma)
RUN npx prisma generate

EXPOSE 3000

# On container start: run any pending DB migrations, then launch the server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
