FROM node:20-alpine

# Install redis and bash (needed for scripts)
RUN apk add --no-cache redis bash

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the backend code
COPY . .

# create default redis config (will be overwritten by env values at runtime)
RUN mkdir -p /data

EXPOSE 3000

ENV NODE_ENV=production
ENV REDIS_PORT=6379
ENV REDIS_PASSWORD=mysecretpassword
# no REDIS_HOST -- Redis will run locally inside the container as 127.0.0.1

# Copy startup script
COPY docker-start.sh /usr/local/bin/docker-start.sh
RUN chmod +x /usr/local/bin/docker-start.sh

# run the script as the container entrypoint
CMD ["/usr/local/bin/docker-start.sh"]
