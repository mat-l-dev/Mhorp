// src/app/api/health/readiness/route.ts
import { NextResponse } from 'next/server';
import { getReadiness } from '@/lib/monitoring/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health/readiness
 * Readiness probe - verifica que el servicio está listo para recibir tráfico
 * Usado por Kubernetes/Docker para saber si debe enviar tráfico al contenedor
 */
export async function GET() {
  const readiness = await getReadiness();
  
  return NextResponse.json(readiness, {
    status: readiness.ready ? 200 : 503,
  });
}
