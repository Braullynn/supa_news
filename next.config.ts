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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' va.vercel-scripts.com translate.google.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com translate.googleapis.com; img-src 'self' data: blob: *.supabase.co *.pollinations.ai images.unsplash.com translate.google.com www.gstatic.com; font-src 'self' fonts.gstatic.com; connect-src 'self' *.supabase.co translate.googleapis.com vitals.vercel-insights.com; frame-src 'self' translate.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
