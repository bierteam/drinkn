# ---- Build with node ----
FROM node:16 AS build  
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY public ./public
COPY src ./src
COPY babel.config.js ./
RUN npm run build

# --- Release with Alpine nginx----
FROM nginx:alpine
RUN rm -rf /etc/nginx/conf.d /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
