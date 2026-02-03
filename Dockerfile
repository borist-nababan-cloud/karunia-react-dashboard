# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code and configuration files
COPY . .

# Build the application
# Note: VITE_ env vars are baked in at build time.
# In Coolify, these should be provided as build environment variables.
RUN npm run build

# Verify the build output
RUN ls -la /app/dist && \
    ls -la /app/dist/assets && \
    test -f /app/dist/index.html || (echo "Build failed: index.html not found" && exit 1)

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Verify files were copied
RUN ls -la /usr/share/nginx/html && \
    ls -la /usr/share/nginx/html/assets

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
