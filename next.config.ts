import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'standalone', // Deshabilitado temporalmente - problemas con symlinks en Windows
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
