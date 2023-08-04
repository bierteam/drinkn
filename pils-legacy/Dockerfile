# --- Release with Alpine ----
FROM node:12-alpine
ENV NODE_ENV production
ENV PORT 3000
EXPOSE 3000
WORKDIR /app
COPY models ./models
COPY services ./services
COPY api ./api
COPY setup.js ./
COPY server.js ./
COPY package*.json ./
RUN npm install --only=production
USER node

CMD ["node", "server.js"]
