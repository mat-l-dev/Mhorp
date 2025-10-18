// src/middleware/metrics.ts
import { NextRequest, NextResponse } from 'next/server';
import { metrics, MetricNames } from '@/lib/monitoring/metrics';
import { logger } from '@/lib/monitoring/logger';

/**
 * Middleware para tracking automático de métricas HTTP
 */
export function metricsMiddleware(request: NextRequest) {
  const start = Date.now();
  const { pathname, searchParams } = request.nextUrl;
  const method = request.method;

  // Generar request ID
  const requestId = crypto.randomUUID();

  // Incrementar contador de requests
  metrics.increment(MetricNames.HTTP_REQUESTS_TOTAL, 1, {
    method,
    path: pathname,
  });

  // Log del request
  logger.withRequest(requestId).info(`${method} ${pathname}`, {
    query: Object.fromEntries(searchParams),
    userAgent: request.headers.get('user-agent'),
  });

  // Medir tiempo de respuesta
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  // Agregar request ID a headers
  response.headers.set('X-Request-ID', requestId);

  // Medir duración (esto se ejecutará después de la respuesta)
  const duration = Date.now() - start;
  metrics.histogram(MetricNames.HTTP_REQUEST_DURATION, duration, {
    method,
    path: pathname,
    status: String(response.status),
  });

  // Log de respuesta
  logger.withRequest(requestId).info(`Response ${response.status}`, {
    duration,
    status: response.status,
  });

  return response;
}

/**
 * Configuración de rutas para el middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
