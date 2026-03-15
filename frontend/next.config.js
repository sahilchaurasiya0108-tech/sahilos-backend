/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy all /api/* requests to the Express backend during development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
