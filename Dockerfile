# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code and configuration files
COPY . .

# Build the application
# Note: VITE_ env vars are baked in at build time.
# In Coolify, these should be provided as build environment variables.
ARG VITE_API_URL
ARG VITE_STRAPI_URL
ARG VITE_STRAPI_API_TOKEN
ARG VITE_GOOGLE_MAPS_API_KEY

RUN npm run build

# Verify the build output
RUN ls -la /app/dist && \
    ls -la /app/dist/assets && \
    test -f /app/dist/index.html || (echo "Build failed: index.html not found" && exit 1)

# CRITICAL: Verify this is NOT a Next.js build
# Fail the build if index.html contains Next.js references
RUN ! grep -q "_next" /app/dist/index.html || (echo "ERROR: Next.js build detected! This should be a Vite build." && exit 1)

# Verify it IS a Vite build (contains /assets/ references)
RUN grep -q "/assets/" /app/dist/index.html || (echo "ERROR: Vite build structure not found in index.html" && exit 1)

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Remove default nginx static assets AND any persistent cached data
RUN rm -rf /usr/share/nginx/html/* && \
    rm -rf /var/cache/nginx/* && \
    rm -rf /tmp/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Verify files were copied
RUN ls -la /usr/share/nginx/html && \
    ls -la /usr/share/nginx/html/assets

# Verify index.html is correct in final image
RUN ! grep -q "_next" /usr/share/nginx/html/index.html || (echo "ERROR: Next.js index.html in final image!" && exit 1)

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
