# ---- Build ----
FROM node:12 AS build  
WORKDIR /app
COPY . ./
RUN npm install
RUN npm run build

# --- Release with Alpine ----
FROM node:12-alpine AS release
ENV NODE_ENV production
ENV PORT 3000
EXPOSE 3000
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/models ./models
COPY --from=build /app/services ./services
COPY --from=build /app/api ./api
COPY --from=build /app/public ./public
COPY --from=build /app/setup.js ./setup.js
COPY --from=build /app/server.js ./
RUN npm install --only=production
USER node

CMD ["node", "server.js"]
