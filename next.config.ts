import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ymtrembvtugopztnyfsk.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'pollinations.ai',
      },
      {
        protocol: 'https',
        hostname: 'gen.pollinations.ai',
      },
      {
        protocol: 'https',
        hostname: 'image.pollinations.ai',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
