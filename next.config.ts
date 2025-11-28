import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'imagedelivery.net', // Common for Farcaster PFPs
      },
    ],
  },
  // Often needed for wallet libraries to avoid ESM/CJS conflicts
  transpilePackages: ['@coinbase/onchainkit', 'wagmi', 'viem'],
};

export default nextConfig;