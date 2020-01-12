# ---- Build with node ----
FROM node:12 AS build  
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY public ./public
COPY src ./src
COPY babel.config.js ./
RUN npm run build

# --- Release with Alpine nginx----
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80