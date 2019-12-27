# ---- Build ----
FROM node:12 AS build  
WORKDIR /app
COPY . ./
RUN npm install
RUN npm run build

# --- Release with Alpine ----
FROM node:12-alpine AS release
ENV NODE_ENV production
ENV PORT 80
EXPOSE 80
WORKDIR /app
COPY package*.json ./
COPY models ./models
COPY services ./services
COPY api ./api
COPY setup.js ./
COPY server.js ./
COPY --from=build /app/public ./public
RUN npm install --only=production
USER node

CMD ["node", "server.js"]
