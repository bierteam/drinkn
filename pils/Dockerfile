FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY models ./models
COPY services ./services
COPY api ./api
COPY setup.js ./
COPY server.js ./

FROM base AS test
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm run test

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts

FROM base
COPY --from=build /app/node_modules /app/node_modules
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
USER node
CMD [ "pnpm", "start" ]
