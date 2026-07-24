FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Install dependencies (handles workspaces)
RUN npm install

# Copy source
COPY . .

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build API and Web
WORKDIR /app
RUN npm run build

# Start the application
WORKDIR /app/apps/api
EXPOSE 7860
ENV NODE_ENV=production
CMD npm start
