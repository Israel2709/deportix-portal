/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Team/league logos come from API-Sports and Firebase Storage; allow rendering them.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.api-sports.io' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
};

export default nextConfig;
