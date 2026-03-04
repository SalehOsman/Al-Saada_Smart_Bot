FROM node:20-alpine

# Install postgresql16-client for backup support (pg_dump/psql) and openssl for Prisma
RUN apk add --no-cache postgresql16-client openssl

# Set working directory
WORKDIR /app

# Copy ALL package.json files first (for proper workspace hoisting)
COPY package.json package-lock.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/module-kit/package.json ./packages/module-kit/
COPY packages/validators/package.json ./packages/validators/

# Install ALL dependencies (tsx needed at runtime for TypeScript execution)
RUN npm ci --legacy-peer-deps

# Copy the rest of the project files
COPY . .

# Generate Prisma client
RUN npm run db:generate

# Expose bot service port
EXPOSE 3000

# Create backups directory for volume mount
RUN mkdir -p /app/backups

# Start the application using tsx (avoids CJS/ESM bundling issues)
CMD ["npx", "tsx", "packages/core/src/main.ts"]
