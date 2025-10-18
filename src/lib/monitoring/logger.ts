// src/lib/monitoring/logger.ts
// Sistema de logging estructurado

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  requestId?: string;
  userId?: string;
  duration?: number;
}

export interface LoggerOptions {
  level?: LogLevel;
  enableConsole?: boolean;
  enableFile?: boolean;
  prettyPrint?: boolean;
}

class Logger {
  private options: Required<LoggerOptions>;
  private logLevels = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
    [LogLevel.FATAL]: 4,
  };

  constructor(options: LoggerOptions = {}) {
    this.options = {
      level: options.level || LogLevel.INFO,
      enableConsole: options.enableConsole ?? true,
      enableFile: options.enableFile ?? false,
      prettyPrint: options.prettyPrint ?? (process.env.NODE_ENV === 'development'),
    };
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const errorContext = error
      ? {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : context;

    this.log(LogLevel.ERROR, message, errorContext);
  }

  /**
   * Log fatal error
   */
  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    const errorContext = error
      ? {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : context;

    this.log(LogLevel.FATAL, message, errorContext);
  }

  /**
   * Log con contexto de request
   */
  withRequest(requestId: string, userId?: string) {
    return {
      debug: (message: string, context?: Record<string, unknown>) =>
        this.log(LogLevel.DEBUG, message, { ...context, requestId, userId }),
      info: (message: string, context?: Record<string, unknown>) =>
        this.log(LogLevel.INFO, message, { ...context, requestId, userId }),
      warn: (message: string, context?: Record<string, unknown>) =>
        this.log(LogLevel.WARN, message, { ...context, requestId, userId }),
      error: (message: string, error?: Error, context?: Record<string, unknown>) => {
        const errorContext = error
          ? { ...context, requestId, userId, error: { name: error.name, message: error.message, stack: error.stack } }
          : { ...context, requestId, userId };
        this.log(LogLevel.ERROR, message, errorContext);
      },
    };
  }

  /**
   * Log con medición de tiempo
   */
  withTimer(message: string) {
    const start = Date.now();
    return {
      done: (context?: Record<string, unknown>) => {
        const duration = Date.now() - start;
        this.log(LogLevel.INFO, message, { ...context, duration });
      },
    };
  }

  /**
   * Método principal de logging
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    // Verificar si el nivel está habilitado
    if (this.logLevels[level] < this.logLevels[this.options.level]) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };

    if (this.options.enableConsole) {
      this.writeToConsole(entry);
    }

    if (this.options.enableFile) {
      this.writeToFile(entry);
    }
  }

  /**
   * Escribir a consola
   */
  private writeToConsole(entry: LogEntry): void {
    const { level, message, timestamp, ...context } = entry;

    if (this.options.prettyPrint) {
      // Formato bonito para desarrollo
      const emoji = this.getLevelEmoji(level);
      const color = this.getLevelColor(level);
      const time = new Date(timestamp).toLocaleTimeString();

      console.log(`${emoji} ${color}[${level.toUpperCase()}]${'\x1b[0m'} ${time} - ${message}`);
      
      if (Object.keys(context).length > 0) {
        console.log('  Context:', context);
      }
    } else {
      // Formato JSON para producción
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Escribir a archivo (implementación futura)
   */
  private writeToFile(entry: LogEntry): void {
    // TODO: Implementar escritura a archivo o servicio de logging
    // Por ahora solo enviamos a console en JSON
    if (typeof window === 'undefined') {
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Obtener emoji para nivel
   */
  private getLevelEmoji(level: LogLevel): string {
    const emojis = {
      [LogLevel.DEBUG]: '🐛',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.ERROR]: '❌',
      [LogLevel.FATAL]: '💀',
    };
    return emojis[level];
  }

  /**
   * Obtener color ANSI para nivel
   */
  private getLevelColor(level: LogLevel): string {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[90m', // Gray
      [LogLevel.INFO]: '\x1b[36m',  // Cyan
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m', // Magenta
    };
    return colors[level];
  }
}

/**
 * Instancia global del logger
 */
export const logger = new Logger({
  level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production',
  prettyPrint: process.env.NODE_ENV === 'development',
});

/**
 * Helper para log de errores HTTP
 */
export function logHttpError(
  error: Error,
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
  }
): void {
  logger.error('HTTP request failed', error, {
    method: request.method,
    url: request.url,
    headers: request.headers,
  });
}

/**
 * Helper para log de errores de DB
 */
export function logDbError(
  error: Error,
  query?: string,
  params?: unknown[]
): void {
  logger.error('Database query failed', error, {
    query,
    params,
  });
}

/**
 * Helper para log de performance
 */
export function logPerformance(
  operation: string,
  duration: number,
  context?: Record<string, unknown>
): void {
  if (duration > 1000) {
    logger.warn(`Slow operation detected: ${operation}`, {
      duration,
      ...context,
    });
  } else {
    logger.debug(`Operation completed: ${operation}`, {
      duration,
      ...context,
    });
  }
}
