# ---- Build with node ----
FROM node:12 AS build  
WORKDIR /app
# COPY . ./
COPY package*.json ./
COPY index.html ./
COPY build ./build
COPY config ./config
COPY src ./src
COPY public ./public

RUN npm install
RUN npm run build

# --- Release with Alpine nginx----
FROM nginx:stable-alpine
COPY --from=build /app/public /usr/share/nginx/html
EXPOSE 80