# Use node 4.4.5 LTS
FROM node:12-slim
ENV LAST_UPDATED 20191106T215503

# Copy source code
COPY . /app

# Change working directory
WORKDIR /app

# Install dependencies
RUN npm install --only=production

# Expose API port to the outside
EXPOSE 3000

# Launch application
CMD ["node","server.js"]