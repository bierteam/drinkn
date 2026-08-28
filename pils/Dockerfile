FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
USER node
WORKDIR /app
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY models ./models
COPY services ./services
COPY api ./api
COPY setup.js ./
COPY server.js ./

FROM base AS test
COPY --chown=node:node test ./test
# base runs as `node` but /app is root-owned, so jest cannot create its
# coverage directory without this
USER root
RUN mkdir -p /app/test/unit/coverage && chown node:node /app/test/unit/coverage
USER node
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm run test

# lets CI pull the coverage report out of the cached test stage
FROM scratch AS coverage
COPY --from=test /app/test/unit/coverage /

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts

FROM base
COPY --from=build /app/node_modules /app/node_modules
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD [ "node", "server.js" ]
