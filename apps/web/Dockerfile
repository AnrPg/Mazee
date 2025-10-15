# apps/web/Dockerfile  (build context = repo root)
FROM node:20-alpine
WORKDIR /app

# 1) Enable Corepack so Yarn 4 is available
RUN corepack enable
RUN apk add --no-cache curl

# 2) Copy Yarn + workspace manifests first (cache-friendly)
#    Include .yarn so plugins/releases/install-state.gz are available
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ ./.yarn/
COPY packages/ts-sdk/package.json packages/ts-sdk/package.json
COPY apps/web/package.json apps/web/package.json

# 3) Install once at build time (for CI / non-mounted runs)
#    --immutable ensures lockfile is honored; fallback to plain install for dev if needed
RUN yarn install --immutable || yarn install

# 4) App sources
COPY . .

WORKDIR /app/apps/web
EXPOSE 3000

# 5) Default dev command (compose will still run an install before dev to handle bind mounts)
CMD ["sh","-lc","corepack enable && corepack prepare yarn@4.10.3 --activate && cd /app && (yarn install --immutable || yarn install) && cd apps/web && yarn dev -p 3000 -H 0.0.0.0"]
# CMD ["yarn", "dev", "-p", "3000", "-H", "0.0.0.0"]


# TODO: If you later want smaller prod images, consider yarn workspaces focus --production to install only what the web app needs

# If you want a production web image later, switch the web CMD to:
# build once
# RUN yarn build
# then run the optimized server
# CMD ["yarn", "start", "-p", "3000", "-H", "0.0.0.0"]
