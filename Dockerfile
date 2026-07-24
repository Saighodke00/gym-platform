FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

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
RUN NODE_ENV=production npm run build

# Start the application
WORKDIR /app/apps/api
EXPOSE 7860
CMD ["node", "-e", "process.env.NODE_ENV='production'; process.env.PORT='7860'; require('./dist/server.js')"]
