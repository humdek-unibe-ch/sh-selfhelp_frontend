import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    allowedDevOrigins: ['127.0.0.1'],

    transpilePackages: ['@selfhelp/shared'],

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
  };

  export default nextConfig;
  