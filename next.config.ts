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
    formats: ['image/avif', 'image/webp'], // Formatos modernos optimizados
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Breakpoints responsive
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Tamaños para imágenes pequeñas
    minimumCacheTTL: 60 * 60 * 24 * 30, // Cache de 30 días
    dangerouslyAllowSVG: true, // Permitir SVG
    contentDispositionType: 'attachment', // Seguridad para SVG
  },
};

export default nextConfig;
