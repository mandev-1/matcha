/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Proxy API requests to Go server during development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
