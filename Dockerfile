# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend . 

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install a simple HTTP server to serve static files
RUN npm install -g serve

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]
