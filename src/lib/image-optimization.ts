// src/lib/image-optimization.ts
// Propósito: Utilidades para optimización de imágenes

/**
 * Tamaños de imagen predefinidos para responsive images
 */
export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, quality: 80 },
  small: { width: 300, height: 300, quality: 85 },
  medium: { width: 600, height: 600, quality: 85 },
  large: { width: 1200, height: 1200, quality: 90 },
  hero: { width: 1920, height: 1080, quality: 90 },
} as const;

export type ImageSize = keyof typeof IMAGE_SIZES;

/**
 * Formatos de imagen soportados
 */
export const IMAGE_FORMATS = {
  webp: 'image/webp',
  avif: 'image/avif',
  jpeg: 'image/jpeg',
  png: 'image/png',
} as const;

export type ImageFormat = keyof typeof IMAGE_FORMATS;

/**
 * Configuración de optimización de imágenes
 */
export interface ImageOptimizationConfig {
  quality?: number;
  width?: number;
  height?: number;
  format?: ImageFormat;
  blur?: boolean;
  blurAmount?: number;
}

/**
 * Genera URL optimizada de imagen de Supabase Storage
 * 
 * Supabase usa Imgix para transformación de imágenes:
 * https://supabase.com/docs/guides/storage/serving/image-transformations
 * 
 * @param url - URL de la imagen en Supabase Storage
 * @param config - Configuración de optimización
 * @returns URL optimizada con parámetros de transformación
 */
export function getOptimizedImageUrl(
  url: string,
  config: ImageOptimizationConfig = {}
): string {
  if (!url) return '';

  // Si no es URL de Supabase, retornar sin optimizar
  if (!url.includes('supabase')) {
    return url;
  }

  const params = new URLSearchParams();

  // Calidad (default: 85)
  if (config.quality) {
    params.append('quality', config.quality.toString());
  }

  // Dimensiones
  if (config.width) {
    params.append('width', config.width.toString());
  }
  if (config.height) {
    params.append('height', config.height.toString());
  }

  // Formato (auto = mejor formato según browser)
  if (config.format) {
    params.append('format', config.format);
  } else {
    // Auto-detect mejor formato
    params.append('format', 'auto');
  }

  // Resize mode: cover mantiene aspect ratio y cubre el área
  if (config.width && config.height) {
    params.append('resize', 'cover');
  }

  // Placeholder blur para lazy loading
  if (config.blur) {
    params.append('blur', (config.blurAmount || 20).toString());
  }

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Genera URL de imagen por tamaño predefinido
 */
export function getImageBySize(url: string, size: ImageSize): string {
  const config = IMAGE_SIZES[size];
  return getOptimizedImageUrl(url, config);
}

/**
 * Genera srcSet para responsive images
 * 
 * @param url - URL base de la imagen
 * @returns String srcSet para usar en <img srcSet={...} />
 */
export function generateSrcSet(url: string): string {
  const sizes: Array<{ size: ImageSize; width: number }> = [
    { size: 'thumbnail', width: 150 },
    { size: 'small', width: 300 },
    { size: 'medium', width: 600 },
    { size: 'large', width: 1200 },
  ];

  return sizes
    .map(({ size, width }) => `${getImageBySize(url, size)} ${width}w`)
    .join(', ');
}

/**
 * Genera sizes attribute para responsive images
 */
export function getImageSizes(type: 'product' | 'hero' | 'thumbnail' = 'product'): string {
  const sizeMap = {
    product: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    hero: '100vw',
    thumbnail: '(max-width: 640px) 50vw, 150px',
  };

  return sizeMap[type];
}

/**
 * Genera placeholder blur data URL
 * Usa para mostrar mientras la imagen real carga
 */
export function getBlurDataUrl(url: string): string {
  return getOptimizedImageUrl(url, {
    width: 10,
    quality: 10,
    blur: true,
    blurAmount: 20,
  });
}

/**
 * Valida si un archivo es una imagen válida
 */
export function isValidImageType(file: File): boolean {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
  ];
  return validTypes.includes(file.type);
}

/**
 * Valida el tamaño de archivo de imagen
 */
export function isValidImageSize(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  const maxBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `La imagen debe ser menor a ${maxSizeMB}MB. Tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Comprime imagen en el cliente antes de subirla
 * Usa canvas API del browser
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calcular nuevas dimensiones manteniendo aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo crear canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('No se pudo comprimir la imagen'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Obtiene dimensiones de una imagen
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
        });
      };

      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Configuración de Next.js Image Optimization
 * Agregar a next.config.ts
 */
export const nextImageConfig = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 año
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

/**
 * Ejemplo de uso en componente
 */
export const ImageOptimizationExample = `
import Image from 'next/image';
import { getOptimizedImageUrl, getBlurDataUrl, generateSrcSet } from '@/lib/image-optimization';

// Opción 1: Next.js Image (recomendado)
<Image
  src={productImage}
  alt="Producto"
  width={600}
  height={600}
  quality={85}
  placeholder="blur"
  blurDataURL={getBlurDataUrl(productImage)}
  sizes="(max-width: 640px) 100vw, 600px"
/>

// Opción 2: HTML nativo con srcSet
<img
  src={getOptimizedImageUrl(productImage, { width: 600, quality: 85 })}
  srcSet={generateSrcSet(productImage)}
  sizes="(max-width: 640px) 100vw, 600px"
  alt="Producto"
  loading="lazy"
/>

// Opción 3: Background image optimizado
<div
  style={{
    backgroundImage: \`url(\${getOptimizedImageUrl(heroImage, { width: 1920, quality: 90 })})\`,
    backgroundSize: 'cover',
  }}
/>
`;
