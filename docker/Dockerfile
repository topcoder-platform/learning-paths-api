ARG NODE_VERSION=26.13.1
FROM node:${NODE_VERSION}-alpine AS dependencies
WORKDIR /learning-paths-api
RUN npm install --global pnpm@11.15.1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tools ./tools
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run test:dependency-compat && pnpm run test:security && pnpm prune --prod

FROM alpine:3.24 AS runtime
ARG NODE_VERSION
ENV NODE_ENV=production
WORKDIR /learning-paths-api
RUN apk upgrade --no-cache \
    && apk add --no-cache 'libcrypto3>=3.5.9-r1' 'libssl3>=3.5.9-r1' ca-certificates "nodejs-current~${NODE_VERSION%%.*}" "nodejs-current>=26.13.1-r0" "zlib>=1.4-r0" \
    && addgroup -S -g 10001 app \
    && adduser -S -D -u 10001 -G app -h /home/app app
COPY --from=dependencies --chown=app:app /learning-paths-api/node_modules ./node_modules
COPY --chown=app:app package.json ./
COPY --chown=app:app app.js app-bootstrap.js app-constants.js app-routes.js ./
COPY --chown=app:app config ./config
COPY --chown=app:app docs/swagger.yaml ./docs/swagger.yaml
COPY --chown=app:app src ./src
USER app
EXPOSE 3001
CMD ["node", "app.js"]
