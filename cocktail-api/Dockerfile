# ---- Build ----
FROM node:16 AS build  
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build

# --- Release with Alpine ----
FROM node:16-alpine AS release
ENV NODE_ENV production
ENV PORT 3000
EXPOSE 3000
WORKDIR /app
COPY --from=build /app/package*.json ./
RUN npm install --only=production
COPY --from=build /app/build ./
USER node
CMD ["node", "server.js"]
