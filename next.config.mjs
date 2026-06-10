/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const SYMFONY_BACKEND_URL = (
  process.env.SYMFONY_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost/symfony'
).replace(/\/+$/, '');

// The frontend's own package version, inlined at build time. The admin
// system page uses it as a self-reported fallback when the backend reports
// `frontend_version: unknown` (i.e. SELFHELP_FRONTEND_VERSION is not set on
// the backend — typical for source/dev setups).
const FRONTEND_VERSION = require('./package.json').version;

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    allowedDevOrigins: ['127.0.0.1'],

    env: {
      NEXT_PUBLIC_FRONTEND_VERSION: FRONTEND_VERSION,
    },

    transpilePackages: ['@selfhelp/shared'],

    // Self-contained production server for the Docker image: emits
    // `.next/standalone` (server.js + only the traced node_modules) so the
    // runtime image never needs `npm install`/source. Browser traffic still
    // goes through the BFF `/api/*`; server code reaches Symfony via
    // SYMFONY_INTERNAL_URL (read at runtime).
    output: 'standalone',

    outputFileTracingRoot: path.join(__dirname, '..'),

    experimental: {
      optimizePackageImports: [
        '@mantine/core',
        '@mantine/hooks',
        '@mantine/notifications',
      ],
    },

    turbopack: {
      root: path.join(__dirname, '..'),
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

  export default nextConfig;
  