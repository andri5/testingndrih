FROM node:18-bookworm-slim

WORKDIR /app

# Install system dependencies for Prisma and Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies (include devDependencies for nodemon in dev)
RUN npm install

# Install Playwright browsers + system deps
RUN npx playwright install --with-deps chromium

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Expose port
EXPOSE 5001

# Start application
CMD ["npm", "run", "dev"]
