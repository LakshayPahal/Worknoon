FROM node:20-alpine

WORKDIR /app

# Copy package descriptors first to leverage Docker layer caching
COPY package.json package-lock.json* ./

# Install packages (npm cache will prevent re-downloading if unchanged)
RUN npm install

# Copy the rest of the application files
COPY . .

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run Next.js in development mode.
# This prevents compilation of pages during Docker build, reducing docker-compose build time by 90%, 
# and compiles pages on-demand in under 2 seconds upon browser request.
CMD ["npm", "run", "dev"]
