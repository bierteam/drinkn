# ---- Base Node ----
FROM node:12 AS base
# Create app directory
WORKDIR /app

# ---- Dependencies ----
FROM base AS dependencies  
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
# install app dependencies including 'devDependencies'
RUN npm install

# ---- Copy Files/Build ----
FROM dependencies AS build  
WORKDIR /app
COPY . .
# Build vue bundle static files
RUN npm run build

# --- Release with Alpine ----
FROM node:12-alpine AS release
# set default environments
ENV NODE_ENV production
ENV PORT 80
# Create app directory
WORKDIR /app
# RUN npm -g install serve
COPY --from=dependencies /app/package.json ./
# Install app dependencies
RUN npm install --only=production
# copy files needed
COPY --from=build /app/config ./config
COPY --from=build /app/models ./models
COPY --from=build /app/services ./services
COPY --from=build /app/api ./api
COPY --from=build /app/public ./public
COPY --from=build /app/server.js .
EXPOSE 80
EXPOSE 3000
CMD ["node", "server.js"]
