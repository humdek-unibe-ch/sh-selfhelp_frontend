/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        optimizePackageImports: ['@mantine/core', '@mantine/hooks', '@mantine/notifications'],
    },
};

export default nextConfig;
