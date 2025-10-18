// src/hooks/useImageUpload.ts
'use client';

import { useState, useCallback } from 'react';
import { compressImage, isValidImageType, isValidImageSize, getImageDimensions } from '@/lib/image-optimization';

export interface ImageUploadOptions {
  maxSizeMB?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  compress?: boolean;
  validateDimensions?: (width: number, height: number) => { valid: boolean; error?: string };
}

export interface ImageUploadState {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  progress: number;
  error: string | null;
  dimensions: { width: number; height: number } | null;
}

export interface ImageUploadActions {
  selectImage: (file: File) => Promise<boolean>;
  uploadImage: (uploadFn: (file: Blob) => Promise<string>) => Promise<string | null>;
  reset: () => void;
  removeImage: () => void;
}

/**
 * Hook para manejo de carga de imágenes con validación y compresión
 * 
 * @example
 * const { state, actions } = useImageUpload({
 *   maxSizeMB: 5,
 *   maxWidth: 1920,
 *   quality: 0.85,
 *   compress: true,
 * });
 * 
 * const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
 *   const file = e.target.files?.[0];
 *   if (file) {
 *     const valid = await actions.selectImage(file);
 *     if (valid) {
 *       const url = await actions.uploadImage(async (blob) => {
 *         return await uploadToSupabase(blob);
 *       });
 *     }
 *   }
 * };
 */
export function useImageUpload(options: ImageUploadOptions = {}): {
  state: ImageUploadState;
  actions: ImageUploadActions;
} {
  const {
    maxSizeMB = 10,
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    compress = true,
    validateDimensions,
  } = options;

  const [state, setState] = useState<ImageUploadState>({
    file: null,
    preview: null,
    uploading: false,
    progress: 0,
    error: null,
    dimensions: null,
  });

  /**
   * Seleccionar y validar imagen
   */
  const selectImage = useCallback(
    async (file: File): Promise<boolean> => {
      setState((prev) => ({ ...prev, error: null }));

      // Validar tipo
      if (!isValidImageType(file)) {
        setState((prev) => ({
          ...prev,
          error: 'Tipo de archivo no válido. Use JPG, PNG, WEBP o AVIF.',
        }));
        return false;
      }

      // Validar tamaño
      const sizeValidation = isValidImageSize(file, maxSizeMB);
      if (!sizeValidation.valid) {
        setState((prev) => ({
          ...prev,
          error: sizeValidation.error || 'Archivo muy grande',
        }));
        return false;
      }

      try {
        // Obtener dimensiones
        const dimensions = await getImageDimensions(file);

        // Validar dimensiones si se proporcionó validador
        if (validateDimensions) {
          const dimValidation = validateDimensions(dimensions.width, dimensions.height);
          if (!dimValidation.valid) {
            setState((prev) => ({
              ...prev,
              error: dimValidation.error || 'Dimensiones no válidas',
            }));
            return false;
          }
        }

        // Crear preview
        const preview = URL.createObjectURL(file);

        setState((prev) => ({
          ...prev,
          file,
          preview,
          dimensions,
          error: null,
        }));

        return true;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: 'Error al procesar la imagen',
        }));
        return false;
      }
    },
    [maxSizeMB, validateDimensions]
  );

  /**
   * Subir imagen con compresión opcional
   */
  const uploadImage = useCallback(
    async (uploadFn: (file: Blob) => Promise<string>): Promise<string | null> => {
      if (!state.file) {
        setState((prev) => ({ ...prev, error: 'No hay archivo seleccionado' }));
        return null;
      }

      setState((prev) => ({ ...prev, uploading: true, progress: 0, error: null }));

      try {
        let fileToUpload: Blob = state.file;

        // Comprimir si está habilitado
        if (compress) {
          setState((prev) => ({ ...prev, progress: 30 }));
          fileToUpload = await compressImage(state.file, {
            maxWidth,
            maxHeight,
            quality,
          });
        }

        setState((prev) => ({ ...prev, progress: 60 }));

        // Ejecutar función de subida
        const url = await uploadFn(fileToUpload);

        setState((prev) => ({ ...prev, progress: 100, uploading: false }));

        return url;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error al subir la imagen';
        setState((prev) => ({
          ...prev,
          uploading: false,
          progress: 0,
          error: errorMessage,
        }));
        return null;
      }
    },
    [state.file, compress, maxWidth, maxHeight, quality]
  );

  /**
   * Resetear estado
   */
  const reset = useCallback(() => {
    if (state.preview) {
      URL.revokeObjectURL(state.preview);
    }
    setState({
      file: null,
      preview: null,
      uploading: false,
      progress: 0,
      error: null,
      dimensions: null,
    });
  }, [state.preview]);

  /**
   * Remover imagen
   */
  const removeImage = useCallback(() => {
    reset();
  }, [reset]);

  return {
    state,
    actions: {
      selectImage,
      uploadImage,
      reset,
      removeImage,
    },
  };
}

/**
 * Hook para manejo de múltiples imágenes
 */
export interface MultiImageUploadState {
  images: Array<{
    id: string;
    file: File;
    preview: string;
    dimensions: { width: number; height: number };
    uploaded: boolean;
    url?: string;
  }>;
  uploading: boolean;
  error: string | null;
}

export function useMultiImageUpload(options: ImageUploadOptions & { maxImages?: number } = {}) {
  const { maxImages = 5, ...uploadOptions } = options;

  const [state, setState] = useState<MultiImageUploadState>({
    images: [],
    uploading: false,
    error: null,
  });

  const addImage = useCallback(
    async (file: File): Promise<boolean> => {
      // Validar límite
      if (state.images.length >= maxImages) {
        setState((prev) => ({
          ...prev,
          error: `Máximo ${maxImages} imágenes permitidas`,
        }));
        return false;
      }

      // Validar tipo
      if (!isValidImageType(file)) {
        setState((prev) => ({
          ...prev,
          error: 'Tipo de archivo no válido. Use JPG, PNG, WEBP o AVIF.',
        }));
        return false;
      }

      // Validar tamaño
      const sizeValidation = isValidImageSize(file, uploadOptions.maxSizeMB);
      if (!sizeValidation.valid) {
        setState((prev) => ({
          ...prev,
          error: sizeValidation.error || 'Archivo muy grande',
        }));
        return false;
      }

      try {
        const dimensions = await getImageDimensions(file);
        const preview = URL.createObjectURL(file);
        const id = Math.random().toString(36).substring(7);

        setState((prev) => ({
          ...prev,
          images: [
            ...prev.images,
            {
              id,
              file,
              preview,
              dimensions,
              uploaded: false,
            },
          ],
          error: null,
        }));

        return true;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: 'Error al procesar la imagen',
        }));
        return false;
      }
    },
    [state.images.length, maxImages, uploadOptions.maxSizeMB]
  );

  const removeImage = useCallback((id: string) => {
    setState((prev) => {
      const image = prev.images.find((img) => img.id === id);
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }
      return {
        ...prev,
        images: prev.images.filter((img) => img.id !== id),
      };
    });
  }, []);

  const uploadAll = useCallback(
    async (uploadFn: (file: Blob) => Promise<string>): Promise<string[]> => {
      setState((prev) => ({ ...prev, uploading: true, error: null }));

      const urls: string[] = [];

      try {
        for (const image of state.images) {
          if (image.uploaded) {
            urls.push(image.url!);
            continue;
          }

          let fileToUpload: Blob = image.file;

          if (uploadOptions.compress) {
            fileToUpload = await compressImage(image.file, {
              maxWidth: uploadOptions.maxWidth,
              maxHeight: uploadOptions.maxHeight,
              quality: uploadOptions.quality,
            });
          }

          const url = await uploadFn(fileToUpload);
          urls.push(url);

          setState((prev) => ({
            ...prev,
            images: prev.images.map((img) =>
              img.id === image.id ? { ...img, uploaded: true, url } : img
            ),
          }));
        }

        setState((prev) => ({ ...prev, uploading: false }));
        return urls;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error al subir imágenes';
        setState((prev) => ({
          ...prev,
          uploading: false,
          error: errorMessage,
        }));
        return urls;
      }
    },
    [state.images, uploadOptions]
  );

  const reset = useCallback(() => {
    state.images.forEach((img) => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });
    setState({
      images: [],
      uploading: false,
      error: null,
    });
  }, [state.images]);

  return {
    state,
    actions: {
      addImage,
      removeImage,
      uploadAll,
      reset,
    },
  };
}
