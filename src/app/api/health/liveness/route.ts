// src/app/api/health/liveness/route.ts
import { NextResponse } from 'next/server';
import { getLiveness } from '@/lib/monitoring/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health/liveness
 * Liveness probe - verifica que el servicio está vivo
 * Usado por Kubernetes/Docker para saber si debe reiniciar el contenedor
 */
export async function GET() {
  const liveness = await getLiveness();
  
  return NextResponse.json(liveness, {
    status: liveness.alive ? 200 : 503,
  });
}
