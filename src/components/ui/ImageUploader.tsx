// src/components/ui/ImageUploader.tsx
'use client';

import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useImageUpload, useMultiImageUpload, ImageUploadOptions } from '@/hooks/useImageUpload';
import { Button } from './button';
import { Progress } from './progress';

export interface ImageUploaderProps extends ImageUploadOptions {
  onUpload: (file: Blob) => Promise<string>;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
  className?: string;
  label?: string;
  helperText?: string;
}

/**
 * Componente de carga de imagen única con drag & drop
 */
export function ImageUploader({
  onUpload,
  onSuccess,
  onError,
  className = '',
  label = 'Subir imagen',
  helperText = 'PNG, JPG, WEBP hasta 10MB',
  ...options
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { state, actions } = useImageUpload(options);

  const handleFileSelect = async (file: File) => {
    const valid = await actions.selectImage(file);
    if (valid) {
      const url = await actions.uploadImage(onUpload);
      if (url) {
        onSuccess?.(url);
      } else if (state.error) {
        onError?.(state.error);
      }
    } else if (state.error) {
      onError?.(state.error);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
        </label>
      )}

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-gray-300 dark:border-gray-700'
        } ${state.uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-blue-400'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={handleChange}
          disabled={state.uploading}
        />

        {state.preview ? (
          <div className="relative">
            <img
              src={state.preview}
              alt="Preview"
              className="max-h-64 mx-auto rounded-lg"
            />
            {state.dimensions && (
              <p className="text-xs text-gray-500 text-center mt-2">
                {state.dimensions.width} × {state.dimensions.height}
              </p>
            )}
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={(e) => {
                e.stopPropagation();
                actions.removeImage();
              }}
              disabled={state.uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Arrastra una imagen aquí o haz clic para seleccionar
            </p>
            {helperText && (
              <p className="mt-1 text-xs text-gray-500">
                {helperText}
              </p>
            )}
          </div>
        )}

        {state.uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 rounded-lg">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
              <p className="mt-2 text-sm text-gray-600">
                Subiendo... {state.progress}%
              </p>
              <Progress value={state.progress} className="mt-2 w-48" />
            </div>
          </div>
        )}
      </div>

      {state.error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </div>
  );
}

/**
 * Componente de carga de múltiples imágenes
 */
export interface MultiImageUploaderProps extends ImageUploadOptions {
  onUpload: (file: Blob) => Promise<string>;
  onSuccess?: (urls: string[]) => void;
  onError?: (error: string) => void;
  maxImages?: number;
  className?: string;
  label?: string;
}

export function MultiImageUploader({
  onUpload,
  onSuccess,
  onError,
  maxImages = 5,
  className = '',
  label = 'Subir imágenes',
  ...options
}: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { state, actions } = useMultiImageUpload({ ...options, maxImages });

  const handleFileSelect = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await actions.addImage(file);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files) {
      handleFileSelect(files);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleUploadAll = async () => {
    const urls = await actions.uploadAll(onUpload);
    if (urls.length > 0) {
      onSuccess?.(urls);
    } else if (state.error) {
      onError?.(state.error);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label} ({state.images.length}/{maxImages})
        </label>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-gray-300 dark:border-gray-700'
        } ${state.uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-blue-400'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={handleChange}
          disabled={state.uploading || state.images.length >= maxImages}
        />

        {state.images.length === 0 ? (
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Arrastra imágenes aquí o haz clic para seleccionar
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Hasta {maxImages} imágenes, PNG, JPG, WEBP hasta 10MB cada una
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {state.images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.preview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.removeImage(image.id);
                  }}
                  disabled={state.uploading}
                >
                  <X className="h-3 w-3" />
                </Button>
                {image.uploaded && (
                  <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    ✓
                  </div>
                )}
              </div>
            ))}

            {state.images.length < maxImages && (
              <div
                className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={handleClick}
              >
                <Upload className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
        )}
      </div>

      {state.error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      {state.images.length > 0 && !state.images.every((img) => img.uploaded) && (
        <Button
          className="mt-4 w-full"
          onClick={handleUploadAll}
          disabled={state.uploading}
        >
          {state.uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>Subir {state.images.length} imágenes</>
          )}
        </Button>
      )}
    </div>
  );
}
