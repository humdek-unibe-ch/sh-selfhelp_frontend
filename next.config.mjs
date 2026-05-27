/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

  };

  export default nextConfig;
  