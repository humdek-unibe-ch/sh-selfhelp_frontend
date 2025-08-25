/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
  
    experimental: {
      optimizePackageImports: [
        '@mantine/core',
        '@mantine/hooks',
        '@mantine/notifications',
      ],
    },
  
    turbopack: {
      // You can add options here if needed, usually empty is fine
    },
  };
  
  export default nextConfig;
  