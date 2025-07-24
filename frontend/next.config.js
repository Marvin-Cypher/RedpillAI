/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  // Remove experimental.appDir as it's default in Next.js 14
  // Remove env.CUSTOM_KEY as it was causing warnings
  
  // Only use rewrites if we have a separate backend deployment
  // For Vercel, we'll use API routes instead
  ...(process.env.NEXT_PUBLIC_API_URL && {
    async rewrites() {
      return [
        {
          source: '/api/backend/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
        },
      ]
    },
  }),
}

module.exports = nextConfig