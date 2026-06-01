/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SYMFONY_BACKEND_URL = (
  process.env.SYMFONY_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost/symfony'
).replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    allowedDevOrigins: ['127.0.0.1'],

    transpilePackages: ['@selfhelp/shared', '@selfhelp/ui'],

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
      resolveAlias: {
        react: './node_modules/react',
        'react-dom': './node_modules/react-dom',
        '@mantine/core': './node_modules/@mantine/core',
        '@mantine/hooks': './node_modules/@mantine/hooks',
      },
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
      ];
    },
  };

  export default nextConfig;
  