FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY vite.config.js ./
COPY eslint.config.js ./
COPY public ./public
COPY index.html ./
COPY src ./src

FROM base AS test
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm run test:ci

# lets CI pull the coverage report out of the cached test stage, so the suite
# is not run a second time just to report on it
FROM scratch AS coverage
COPY --from=test /app/coverage /

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm run build

# unprivileged variant: listens on 8080, so the container needs neither root
# nor any capability. Runs as nobody (65534) rather than the image's own 101,
# to match the other services -- only its cache directory has to follow.
FROM nginxinc/nginx-unprivileged:1.31-alpine
USER root
RUN rm -rf /etc/nginx/conf.d /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN chown -R 65534:65534 /var/cache/nginx
USER 65534
EXPOSE 8080
