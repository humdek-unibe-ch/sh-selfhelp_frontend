/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        optimizePackageImports: ['@mantine/core', '@mantine/hooks', '@mantine/notifications'],
    },
    async rewrites() {
        return [
            // Serve uploaded assets directly
            {
                source: '/uploads/:path*',
                destination: '/api/uploads/:path*',
            },
        ];
    },
};

export default nextConfig;
