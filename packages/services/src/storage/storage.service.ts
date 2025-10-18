// packages/services/src/storage/storage.service.ts
// Propósito: Servicio centralizado para gestión de archivos en Supabase Storage

import type { SupabaseClient } from '@supabase/supabase-js';
import { StorageError, ValidationError } from '../common/errors';

/**
 * Configuración de validación de archivos
 */
export interface FileValidationOptions {
  maxSize?: number; // Tamaño máximo en bytes
  allowedTypes?: string[]; // MIME types permitidos
  allowedExtensions?: string[]; // Extensiones permitidas
}

/**
 * Resultado de subida de archivo
 */
export interface UploadResult {
  path: string;
  publicUrl?: string;
  signedUrl?: string;
}

/**
 * Servicio de Storage
 * 
 * Responsabilidades:
 * - Subir archivos con validación
 * - Generar URLs firmadas
 * - Eliminar archivos
 * - Validar tipos y tamaños
 */
export class StorageService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Sube un comprobante de pago
   */
  async uploadPaymentProof(
    userId: string,
    orderId: string,
    file: File
  ): Promise<UploadResult> {
    // Validar archivo
    this.validateFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
    });

    // Generar nombre único
    const timestamp = Date.now();
    const extension = this.getFileExtension(file.name);
    const fileName = `${orderId}_${timestamp}${extension}`;
    const path = `payment-proofs/${userId}/${fileName}`;

    // Subir a bucket
    const { data, error } = await this.supabase.storage
      .from('orders')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new StorageError(`Error al subir comprobante: ${error.message}`);
    }

    // Generar URL firmada (expira en 1 hora por defecto)
    const signedUrl = await this.getSignedUrl('orders', path, 3600);

    return {
      path: data.path,
      signedUrl,
    };
  }

  /**
   * Sube una imagen de producto (admin)
   */
  async uploadProductImage(
    file: File,
    productSlug: string
  ): Promise<UploadResult> {
    // Validar que sea imagen
    this.validateFile(file, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    });

    // Generar nombre único
    const timestamp = Date.now();
    const extension = this.getFileExtension(file.name);
    const fileName = `${productSlug}_${timestamp}${extension}`;
    const path = `products/${fileName}`;

    // Subir a bucket público
    const { data, error } = await this.supabase.storage
      .from('products')
      .upload(path, file, {
        cacheControl: '31536000', // 1 año
        upsert: false,
      });

    if (error) {
      throw new StorageError(`Error al subir imagen: ${error.message}`);
    }

    // Obtener URL pública
    const { data: { publicUrl } } = this.supabase.storage
      .from('products')
      .getPublicUrl(path);

    return {
      path: data.path,
      publicUrl,
    };
  }

  /**
   * Genera una URL firmada para acceder a un archivo privado
   */
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600 // 1 hora por defecto
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error || !data) {
      throw new StorageError(`Error al generar URL firmada: ${error?.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Obtiene URL pública de un archivo (solo para buckets públicos)
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Elimina un archivo
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new StorageError(`Error al eliminar archivo: ${error.message}`);
    }
  }

  /**
   * Elimina múltiples archivos
   */
  async deleteFiles(bucket: string, paths: string[]): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      throw new StorageError(`Error al eliminar archivos: ${error.message}`);
    }
  }

  /**
   * Lista archivos en una carpeta
   */
  async listFiles(bucket: string, path: string = ''): Promise<unknown[]> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .list(path);

    if (error) {
      throw new StorageError(`Error al listar archivos: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Valida un archivo según las opciones especificadas
   */
  private validateFile(file: File, options: FileValidationOptions): void {
    // Validar tamaño
    if (options.maxSize && file.size > options.maxSize) {
      const maxSizeMB = (options.maxSize / (1024 * 1024)).toFixed(2);
      throw new ValidationError(
        `Archivo muy grande. Tamaño máximo: ${maxSizeMB}MB`
      );
    }

    // Validar tipo MIME
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      throw new ValidationError(
        `Tipo de archivo no permitido. Tipos permitidos: ${options.allowedTypes.join(', ')}`
      );
    }

    // Validar extensión
    if (options.allowedExtensions) {
      const extension = this.getFileExtension(file.name);
      if (!options.allowedExtensions.includes(extension)) {
        throw new ValidationError(
          `Extensión no permitida. Extensiones permitidas: ${options.allowedExtensions.join(', ')}`
        );
      }
    }

    // Validar que el archivo no esté vacío
    if (file.size === 0) {
      throw new ValidationError('El archivo está vacío');
    }
  }

  /**
   * Obtiene la extensión de un archivo
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length < 2) {
      return '';
    }
    return `.${parts[parts.length - 1].toLowerCase()}`;
  }

  /**
   * Genera un nombre de archivo único
   */
  generateUniqueFileName(originalName: string, prefix: string = ''): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = this.getFileExtension(originalName);
    const baseName = originalName.replace(extension, '').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    
    return prefix 
      ? `${prefix}_${baseName}_${timestamp}_${random}${extension}`
      : `${baseName}_${timestamp}_${random}${extension}`;
  }
}
