# SPDX-FileCopyrightText: 2026 Humdek, University of Bern
# SPDX-License-Identifier: MPL-2.0
#
# Production frontend image (Next.js standalone server).
#
# Invariants this image preserves (see AGENTS.md "BFF Rules"):
#   - Browser traffic uses the same-origin BFF prefix `/api/*`
#     (NEXT_PUBLIC_API_URL), never the internal backend URL.
#   - Server-side code (RSC + BFF route handlers + the `/plugin-artifacts`
#     rewrite) reaches Symfony over the internal Docker network at
#     SYMFONY_INTERNAL_URL (default `http://backend:8080`, the manager's
#     constant service name + port — identical for every instance).
#
# The `/plugin-artifacts` rewrite destination is frozen into the build
# manifest, so SYMFONY_INTERNAL_URL is supplied at BUILD time as well as at
# runtime. Both default to the internal service URL, so a stock build works
# unchanged inside every generated instance compose project.
#
# Production servers pull this signed, pre-built image. They never run
# `npm install` / `npm build` / source compilation (must-not-break rule).

# syntax=docker/dockerfile:1.7
ARG NODE_IMAGE=node:22-bookworm-slim

# ---------------------------------------------------------------------------
# deps: resolve production+dev dependencies exactly from the lockfile.
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS deps
WORKDIR /build
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ---------------------------------------------------------------------------
# builder: compile the standalone server. The rewrite target is baked here.
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS builder
WORKDIR /build
# Internal Docker URL: bakes the `/plugin-artifacts` + `/uploads` rewrite
# targets (frozen in the build manifest) to the backend service.
ARG SYMFONY_INTERNAL_URL=http://backend:8080
ENV SYMFONY_INTERNAL_URL=${SYMFONY_INTERNAL_URL}
# Browser API base (BFF). NEXT_PUBLIC_* is inlined at build time, so the
# same-origin `/api` prefix must be baked here, not supplied at runtime. This
# also makes `getAssetUrl` emit same-origin `/uploads` + `/assets` paths.
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
COPY --from=deps /build/node_modules ./node_modules
COPY . .
RUN npm run build
# The plugin runtime-shim route needs the export names of every allowlisted
# singleton (PLUGIN_RUNTIME_SHIM_SPECIFIERS), but the standalone runtime
# image prunes node_modules below what its escape-hatch dynamic import can
# resolve. Enumerate the exports here — while the full node_modules tree
# still exists — into a JSON manifest placed next to server.js.
RUN node scripts/emit-runtime-shim-exports.mjs .next/standalone/build/runtime-shim-exports.json

# ---------------------------------------------------------------------------
# runtime: minimal, non-root, self-contained standalone server.
#
# `outputFileTracingRoot` is the repo parent, so the standalone tree nests
# under a subdir named after the builder WORKDIR basename (`build`). We copy
# that subdir's contents to /app, then add the static assets and public dir
# that Next intentionally leaves out of the standalone bundle.
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Server-side -> Symfony over the internal Docker network. Overridable by the
# instance compose, but defaults to the manager's constant internal service.
ENV SYMFONY_INTERNAL_URL=http://backend:8080

COPY --from=builder --chown=node:node /build/.next/standalone/build/ ./
COPY --from=builder --chown=node:node /build/.next/static ./.next/static
COPY --from=builder --chown=node:node /build/public ./public

USER node
EXPOSE 3000

# Liveness probe hits the dependency-free BFF health route (never calls
# upstream Symfony). Node 22 ships a global fetch, so no curl/wget package.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
