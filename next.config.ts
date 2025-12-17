import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Use wildcard to cover this and potential other supabase domains if project ID changes
      },
    ],
  },
};

export default nextConfig;
