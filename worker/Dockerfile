FROM mcr.microsoft.com/playwright:v1.57.0-noble

WORKDIR /app

# Install full deps (including devDependencies for tsc). --ignore-scripts
# skips Playwright's browser download postinstall — the base image already
# ships with the matching Chromium.
COPY package.json package-lock.json ./
# Use install (not ci) so platform-specific optional deps resolve on Linux
# even though the lockfile was generated on macOS.
RUN npm install --include=dev --ignore-scripts

COPY tsconfig.json ./
COPY src ./src

RUN npx tsc

# The official playwright image ships full Chromium, but not the headless-
# shell variant that playwright-core >=1.49 uses by default. Install it.
RUN npx playwright install chromium-headless-shell

# Slim the runtime image by dropping devDependencies post-build.
ENV NODE_ENV=production
RUN npm prune --omit=dev --ignore-scripts

CMD ["node", "dist/index.js"]
