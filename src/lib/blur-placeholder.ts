import { getPlaiceholder } from 'plaiceholder';

/**
 * Genera un blur data URL para una imagen
 * Usado para placeholders mientras carga la imagen real
 */
export async function getImageBlurData(imageSrc: string): Promise<{
  blurDataURL: string;
  img: { width: number; height: number };
} | null> {
  try {
    // Si es una URL externa, la descargamos primero
    let buffer: Buffer;

    if (imageSrc.startsWith('http')) {
      const response = await fetch(imageSrc);
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // Para imágenes locales, las leemos directamente
      const fs = await import('fs/promises');
      const path = await import('path');
      const imagePath = path.join(process.cwd(), 'public', imageSrc);
      buffer = await fs.readFile(imagePath);
    }

    const { base64, metadata } = await getPlaiceholder(buffer, { size: 10 });

    return {
      blurDataURL: base64,
      img: { width: metadata.width, height: metadata.height },
    };
  } catch (error) {
    console.error('Error generating blur placeholder:', error);
    return null;
  }
}

/**
 * Genera blur placeholders para múltiples imágenes en paralelo
 */
export async function getMultipleImageBlurData(imageSources: string[]): Promise<
  Map<string, { blurDataURL: string; img: { width: number; height: number } }>
> {
  const blurDataMap = new Map();

  const results = await Promise.allSettled(
    imageSources.map(async (src) => {
      const blurData = await getImageBlurData(src);
      return { src, blurData };
    })
  );

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.blurData) {
      blurDataMap.set(result.value.src, result.value.blurData);
    }
  });

  return blurDataMap;
}

/**
 * Genera un blur placeholder simple basado en color
 * Alternativa más rápida cuando no necesitamos precisión
 */
export function getSimpleBlurDataURL(color: string = '#f0f0f0'): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'%3E%3Crect width='4' height='3' fill='${encodeURIComponent(color)}'/%3E%3C/svg%3E`;
}
