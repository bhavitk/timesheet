/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Enable standalone build for Docker
  output: "standalone",

  // Optimize for production
  compress: true,

  // Environment variables configuration
  env: {
    NEXT_PUBLIC_GRAPHQL_URL:
      process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:8181/graphql",
  },

  // Image optimization (if using Next.js Image component)
  images: {
    unoptimized: true, // Disable for Docker deployment
  },

  // Experimental features
  experimental: {
    // Enable if using app directory
    // appDir: true,
  },
};

module.exports = nextConfig;
