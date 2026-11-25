# Notifications image for Cloud Run: the subgraph at /api, the Pub/Sub push
# route at /internal/notices, and the built remote at /notification.
# The gateway, Pub/Sub and Ki.CL's server are the only callers.

FROM node:24-slim

WORKDIR /src

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
COPY Client/package.json ./Client/
COPY Server/package.json ./Server/

# Dev dependencies are needed: the build uses Vite and the server runs on tsx.
RUN yarn install --immutable

COPY . .

RUN yarn build

ENV NODE_ENV=production

EXPOSE 8080

CMD ["yarn", "tsx", "--tsconfig", "Server/tsconfig.json", "Server/index.ts"]
