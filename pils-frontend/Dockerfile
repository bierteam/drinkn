# ---- Build with node ----
FROM node:20 AS build  
WORKDIR /app
COPY public ./public
COPY index.html ./
COPY build ./build
COPY config ./config
COPY src ./src
COPY package*.json ./
RUN npm install --force
RUN npm run build

# --- Release with Alpine nginx----
FROM nginx:alpine
RUN rm -rf /etc/nginx/conf.d /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/public /usr/share/nginx/html
EXPOSE 80
