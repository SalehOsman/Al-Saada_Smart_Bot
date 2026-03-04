FROM node:20-alpine

# Install postgresql16-client for backup support (pg_dump/psql)
RUN apk add --no-cache postgresql16-client

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy project files
COPY . .

# Build the project
RUN npm run build

# Expose bot service port
EXPOSE 3000

# Create backups directory for volume mount
RUN mkdir -p /app/backups

# Start the application
CMD ["node", "dist/main.js"]
