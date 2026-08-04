FROM node:24.19.0-alpine3.24 AS dependencies

WORKDIR /learning-paths-api

RUN npm install --global pnpm@9.15.9

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

FROM node:24.19.0-alpine3.24 AS runtime

ENV NODE_ENV=production
WORKDIR /learning-paths-api

RUN apk upgrade --no-cache \
    && rm -rf /usr/local/lib/node_modules/npm \
        /usr/local/lib/node_modules/corepack \
        /usr/local/bin/npm \
        /usr/local/bin/npx \
        /usr/local/bin/corepack

COPY --from=dependencies --chown=node:node /learning-paths-api/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node app.js app-bootstrap.js app-constants.js app-routes.js ./
COPY --chown=node:node config ./config
COPY --chown=node:node docs/swagger.yaml ./docs/swagger.yaml
COPY --chown=node:node src ./src

USER node

CMD ["node", "app.js"]
