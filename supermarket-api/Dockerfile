# ---- Build ----
FROM node:17 AS build  
WORKDIR /app
COPY . ./
RUN npm install
RUN npm run build

# --- Release with Alpine ----
FROM node:17-alpine AS release
ENV NODE_ENV production
ENV PORT 3000
EXPOSE 3000
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/build ./
RUN npm install --only=production
USER node
CMD ["node", "index.js"]
