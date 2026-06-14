# Build Stage
FROM node:20-slim AS builder
# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
# Clean up dev dependencies to minimize container size
RUN npm prune --production

# Runner Stage
FROM node:20-slim AS runner
# Install OpenSSL for Prisma in runner container as well
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
ENV NODE_ENV=production

# Copy built app and required dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Expose default API port
EXPOSE 3000

# Set entrypoint to run migrations then start app
ENTRYPOINT ["/app/docker-entrypoint.sh"]
# Default command (starts both API and Worker concurrently via start.js)
CMD ["node", "dist/start.js"]
