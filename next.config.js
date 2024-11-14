/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost/selfhelp/cms-api/:path*'
            }
        ]
    }
}

module.exports = nextConfig 