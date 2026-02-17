/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone mode for Docker (runs Next.js server, Go proxies API calls)
  output: process.env.NODE_ENV === 'production' && process.env.DOCKER_ENV === 'true' ? 'standalone' : undefined,
  // Skip ESLint during builds (especially in Docker)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip TypeScript type checking during builds (we'll catch errors in CI/dev)
  typescript: {
    ignoreBuildErrors: false, // Keep type checking, but fix the actual error
  },
  // Proxy API requests and uploads to Go server during development
  async rewrites() {
    // Only use rewrites in development (not in static export)
    if (process.env.DOCKER_ENV === 'true' || process.env.NODE_ENV === 'production') {
      return [];
    }
    // Local development
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:8080/uploads/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
