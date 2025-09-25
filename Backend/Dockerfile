FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the app
COPY . .

# Expose the backend port
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]
