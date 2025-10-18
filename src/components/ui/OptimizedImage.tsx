// src/components/ui/OptimizedImage.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getOptimizedImageUrl, getBlurDataUrl, ImageSize, IMAGE_SIZES } from '@/lib/image-optimization';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  size?: ImageSize;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoadingComplete?: () => void;
  fallbackSrc?: string;
}

/**
 * Componente de imagen optimizada con lazy loading y blur placeholder
 * 
 * Características:
 * - Lazy loading automático
 * - Blur placeholder mientras carga
 * - Tamaños predefinidos responsive
 * - Manejo de errores con fallback
 * - Optimización automática vía Supabase/Imgix
 * 
 * @example
 * <OptimizedImage
 *   src={product.image_url}
 *   alt={product.name}
 *   size="medium"
 *   className="rounded-lg"
 * />
 */
export function OptimizedImage({
  src,
  alt,
  size = 'medium',
  className = '',
  priority = false,
  fill = false,
  objectFit = 'cover',
  onLoadingComplete,
  fallbackSrc = '/images/placeholder.png',
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imageSrc = error ? fallbackSrc : src;
  const sizeConfig = IMAGE_SIZES[size];
  
  // Generar blur placeholder
  const blurDataURL = getBlurDataUrl(imageSrc);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    onLoadingComplete?.();
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };

  if (fill) {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={imageSrc}
          alt={alt}
          fill
          quality={sizeConfig.quality}
          placeholder="blur"
          blurDataURL={blurDataURL}
          priority={priority}
          className={`object-${objectFit} transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleLoadingComplete}
          onError={handleError}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={sizeConfig.width}
      height={sizeConfig.height}
      quality={sizeConfig.quality}
      placeholder="blur"
      blurDataURL={blurDataURL}
      priority={priority}
      className={`transition-opacity duration-300 ${
        isLoading ? 'opacity-0' : 'opacity-100'
      } ${className}`}
      onLoad={handleLoadingComplete}
      onError={handleError}
      sizes={`(max-width: 640px) 100vw, ${sizeConfig.width}px`}
    />
  );
}

/**
 * Galería de imágenes optimizada
 */
export interface ImageGalleryProps {
  images: Array<{ url: string; alt: string }>;
  size?: ImageSize;
  className?: string;
  columns?: 2 | 3 | 4;
}

export function ImageGallery({
  images,
  size = 'medium',
  className = '',
  columns = 3,
}: ImageGalleryProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={`grid gap-4 ${gridCols} ${className}`}>
      {images.map((image, index) => (
        <OptimizedImage
          key={index}
          src={image.url}
          alt={image.alt}
          size={size}
          className="rounded-lg"
        />
      ))}
    </div>
  );
}

/**
 * Avatar optimizado
 */
export interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackInitials?: string;
}

export function Avatar({
  src,
  alt,
  size = 'md',
  className = '',
  fallbackInitials,
}: AvatarProps) {
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl',
  }[size];

  const dimensions = {
    sm: 32,
    md: 40,
    lg: 64,
    xl: 96,
  }[size];

  if (!src || error) {
    return (
      <div
        className={`${sizeClasses} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-medium text-gray-600 dark:text-gray-300 ${className}`}
      >
        {fallbackInitials || alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  const optimizedSrc = getOptimizedImageUrl(src, {
    width: dimensions,
    height: dimensions,
    quality: 85,
  });

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={dimensions}
      height={dimensions}
      className={`${sizeClasses} rounded-full object-cover ${className}`}
      onError={() => setError(true)}
    />
  );
}

/**
 * Hero image con lazy loading
 */
export interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  overlay?: boolean;
  overlayOpacity?: number;
  children?: React.ReactNode;
}

export function HeroImage({
  src,
  alt,
  className = '',
  priority = true,
  overlay = false,
  overlayOpacity = 40,
  children,
}: HeroImageProps) {
  return (
    <div className={`relative w-full h-full ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        quality={90}
        priority={priority}
        className="object-cover"
        sizes="100vw"
      />
      {overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity / 100 }}
        />
      )}
      {children && (
        <div className="relative z-10 h-full flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
