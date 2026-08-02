/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Reduce the amount of code pulled from drei by importing its barrels smartly.
    optimizePackageImports: ['@react-three/drei'],
  },
};

export default nextConfig;
