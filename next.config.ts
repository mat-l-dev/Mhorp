import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Para Docker
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
