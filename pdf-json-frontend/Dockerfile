# ==========================================
# PDF-to-JSON Frontend Production Dockerfile
# Multi-stage: Node 20 Vite Build -> Nginx Alpine Runner
# ==========================================

# Stage 1: Build stage
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Accept build arguments for environment variables
ARG VITE_API_URL=/api
ARG VITE_APP_NAME="PDF to JSON Converter"

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for React SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
