# --- Release with Alpine ----
FROM node:20-alpine
ENV NODE_ENV production
ENV PORT 3000
EXPOSE 3000
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY models ./models
COPY services ./services
COPY api ./api
COPY setup.js ./
COPY server.js ./
USER node

CMD ["node", "server.js"]
