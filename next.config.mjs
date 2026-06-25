/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const SYMFONY_BACKEND_URL = (
  process.env.SYMFONY_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost/symfony'
).replace(/\/+$/, '');

// Server-only upstream for the installed mobile-preview image. Production
// Traefik normally intercepts /mobile-preview before it reaches Next.js, while
// manager local mode publishes only the frontend port. The rewrite below is
// therefore the local same-origin path into the preview container.
const MOBILE_PREVIEW_INTERNAL_URL = (
  process.env.MOBILE_PREVIEW_INTERNAL_URL ||
  'http://mobile-preview:8080'
).replace(/\/+$/, '');

// The frontend's own package version, inlined at build time. The admin
// system page uses it as a self-reported fallback when the backend reports
// `frontend_version: unknown` (i.e. SELFHELP_FRONTEND_VERSION is not set on
// the backend — typical for source/dev setups).
const FRONTEND_VERSION = require('./package.json').version;

/**
 * @param {string} phase
 * @returns {import('next').NextConfig}
 */
const createNextConfig = (phase) => {
  // Next 16 requires output-file tracing and Turbopack to use the same root.
  // Keep local development scoped to this repository, while preserving the
  // parent-root standalone layout expected by the production Dockerfile.
  const projectRoot =
    phase === PHASE_DEVELOPMENT_SERVER
      ? __dirname
      : path.join(__dirname, '..');

  const nextConfig = {
    reactStrictMode: true,
    allowedDevOrigins: ['127.0.0.1'],

    env: {
      NEXT_PUBLIC_FRONTEND_VERSION: FRONTEND_VERSION,
    },

    transpilePackages: ['@selfhelp/shared'],

    /**
     * Keep server-only CommonJS packages OUT of the bundle.
     *
     * `isomorphic-dompurify` lazily `require('jsdom')` on the server. When
     * Turbopack bundles the wrapper it rewrites that inner require to a
     * synthetic, content-hashed external id (e.g. `jsdom-a75e3a59d07dd9e7`)
     * that does not exist at runtime, so every server-rendered page that
     * sanitizes HTML (the public `[[...slug]]` route and the admin styles)
     * crashed with `Cannot find module 'jsdom-…'`. Marking both packages as
     * server externals makes Next emit a plain `require('isomorphic-dompurify')`
     * / `require('jsdom')` and copy them (and `dompurify`) into the standalone
     * `node_modules`, so the bare specifier resolves normally in the image.
     */
    serverExternalPackages: ['isomorphic-dompurify', 'jsdom'],

    // Self-contained production server for the Docker image: emits
    // `.next/standalone` (server.js + only the traced node_modules) so the
    // runtime image never needs `npm install`/source. Browser traffic still
    // goes through the BFF `/api/*`; server code reaches Symfony via
    // SYMFONY_INTERNAL_URL (read at runtime).
    output: 'standalone',

    outputFileTracingRoot: projectRoot,

    experimental: {
      /**
       * Barrel-import optimisation. Next already defaults this on for
       * `@tabler/icons-react`, `date-fns`, etc., but NOT for `@mantine/*`.
       * The admin CMS pulls in many Mantine sub-packages (dates, form,
       * dropzone, carousel, tiptap, schedule, code-highlight) plus the core
       * trio; without this every `import { X } from '@mantine/dates'` makes
       * Turbopack load the whole barrel, which inflates the dev server's
       * module graph (a measured multi-GB dev process on Windows) and slows
       * HMR. Listing each sub-package keeps only the used members in the graph.
       */
      optimizePackageImports: [
        '@mantine/core',
        '@mantine/hooks',
        '@mantine/notifications',
        '@mantine/dates',
        '@mantine/form',
        '@mantine/dropzone',
        '@mantine/carousel',
        '@mantine/code-highlight',
        '@mantine/tiptap',
        '@mantine/schedule',
      ],
    },

    turbopack: {
      /**
       * Dev: scope the Turbopack root (the module-resolution AND file-watch
       * boundary) to THIS app. Pointing it at the repo parent made the dev
       * watcher crawl every sibling repo under `d:/TPF/SelfHelp` — including the
       * backend's `var/cache/dev` + `var/log` (rewritten on every request, of
       * which there are thousands) and ~10 repos' `node_modules`. On Windows
       * that watcher pegged memory (multi-GB dev process) and fired constant
       * spurious change events, so HMR hung and pages stopped reloading. The app
       * dir has its own `package-lock.json`, so it is a valid standalone root and
       * Turbopack ignores everything outside it ("files outside of the project
       * directory will not be compiled").
       *
       * Production build keeps the parent root so it stays equal to
       * `outputFileTracingRoot` and the Docker standalone still nests under
       * `build/` (see the Dockerfile). In Docker the parent is just `/` (only the
       * `build/` app lives there), so it carries none of the local churn.
       */
      root: projectRoot,
    },

    /**
     * Plugin runtime artifacts are served by Symfony from
     * `public/plugin-artifacts/<id>-<ver>/...` and embedded into the
     * plugin manifest as host-relative URLs (`/plugin-artifacts/...`).
     * The frontend at `localhost:3000` does not own those files, so we
     * rewrite the path transparently to the backend. This keeps the
     * manifest deployment-portable (no need to bake an absolute backend
     * URL into the DB) while still letting the browser do a same-origin
     * `import()` for the plugin ESM bundle.
     */
    async rewrites() {
      return [
        {
          source: '/mobile-preview/:path*',
          destination: `${MOBILE_PREVIEW_INTERNAL_URL}/mobile-preview/:path*`,
        },
        {
          source: '/plugin-artifacts/:path*',
          destination: `${SYMFONY_BACKEND_URL}/plugin-artifacts/:path*`,
        },
        /**
         * Symfony-served user assets (`/uploads/...`). In production the
         * backend is private and Traefik only exposes the frontend, so the
         * browser reaches uploads same-origin through the frontend, which
         * proxies to the internal backend (same pattern as plugin-artifacts).
         * `getAssetUrl` emits same-origin `/uploads/...` paths when the API
         * base is a path prefix (the production BFF mode).
         */
        {
          source: '/uploads/:path*',
          destination: `${SYMFONY_BACKEND_URL}/uploads/:path*`,
        },
      ];
    },
  };

  return nextConfig;
};

export default createNextConfig;
