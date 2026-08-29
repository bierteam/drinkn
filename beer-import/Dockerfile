FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY eslint.config.mjs ./
COPY models ./models
COPY services ./services
COPY setup.js ./
COPY server.js ./

FROM base AS test
COPY test ./test
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm run test

# lets CI pull the coverage report out of the cached test stage
FROM scratch AS coverage
COPY --from=test /app/test/unit/coverage /

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts

FROM base
COPY --from=build /app/node_modules /app/node_modules
# nobody, and numeric on purpose: kubelet cannot verify runAsNonRoot against a
# named user, so a named USER would force runAsUser into every manifest
USER 65534
ENV NODE_ENV=production
CMD [ "node", "server.js" ]
