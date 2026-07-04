/** @type {import('next').NextConfig} */
import os from 'node:os';

/** IPv4 addresses on this machine (non-loopback) so HMR / _next/* work from other devices on LAN. */
function localLanHostnames() {
  const hosts = new Set();
  for (const ifaces of Object.values(os.networkInterfaces())) {
    if (!ifaces) continue;
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        hosts.add(iface.address);
      }
    }
  }
  return [...hosts];
}

function lanDevOrigins() {
  const fromEnv = (process.env.ALLOWED_DEV_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...fromEnv, ...localLanHostnames()];
}

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: lanDevOrigins(),
  // Team/league logos come from API-Sports and Firebase Storage; allow rendering them.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.api-sports.io' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
};

export default nextConfig;
