FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev for building)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Production image
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the generated Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built code
COPY --from=builder /app/dist ./dist

EXPOSE 4000

# Start the server
CMD ["npm", "start"]
