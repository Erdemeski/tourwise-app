# Backend Dockerfile - Development mode
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy root package files (backend deps are in root package.json)
COPY package*.json ./

# Install all dependencies (including devDependencies for nodemon)
RUN npm ci

# Copy backend source code
COPY backend/ ./backend/

# Expose the API port
EXPOSE 3000

# Start the backend with nodemon for hot reload
CMD ["npm", "run", "dev"]
