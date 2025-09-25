# Use Node.js Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the backend code
COPY . .

# Expose backend port
EXPOSE 3000

# Environment variables (optional defaults)
ENV NODE_ENV=production
ENV REDIS_HOST=your-redis-host
ENV REDIS_PORT=6379
ENV REDIS_PASSWORD=mysecretpassword

# Start the server
CMD ["node", "index.js"]
