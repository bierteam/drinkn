# --- Release with Alpine ----
FROM node:20-alpine AS release
ENV NODE_ENV production
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY models ./models
COPY services ./services
COPY setup.js ./
COPY server.js ./
USER node

CMD ["node", "server.js"]
