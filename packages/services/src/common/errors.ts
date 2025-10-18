// packages/services/src/common/errors.ts
// Propósito: Manejo centralizado de errores de la aplicación

/**
 * Clase base para todos los errores de la aplicación
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * Error cuando el usuario no está autenticado
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado. Debes iniciar sesión.') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

/**
 * Error cuando el usuario no tiene permisos
 */
export class ForbiddenError extends AppError {
  constructor(message = 'No tienes permisos para realizar esta acción.') {
    super(message, 'FORBIDDEN', 403);
  }
}

/**
 * Error cuando un recurso no se encuentra
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number) {
    const message = id 
      ? `${resource} con ID "${id}" no encontrado.`
      : `${resource} no encontrado.`;
    super(message, 'NOT_FOUND', 404);
  }
}

/**
 * Error de validación de datos
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Error de conflicto (ej: recurso ya existe)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

/**
 * Error de negocio (lógica de negocio violada)
 */
export class BusinessError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'BUSINESS_ERROR', 422, details);
  }
}

/**
 * Error de almacenamiento (upload/download de archivos)
 */
export class StorageError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'STORAGE_ERROR', 500, details);
  }
}

/**
 * Error de base de datos
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

/**
 * Utilidad para verificar si un error es de tipo AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Convierte cualquier error en un formato consistente
 */
export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'INTERNAL_ERROR', 500);
  }

  return new AppError('Error desconocido', 'UNKNOWN_ERROR', 500);
}
