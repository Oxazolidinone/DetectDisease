# Use Node.js as base image
FROM node:18-alpine

# Install wget for health check
RUN apk add --no-cache wget

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (both local and global)
RUN npm install && \
    npm install -g live-server http-server

# Copy all frontend files
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the development server
CMD ["npm", "start"]