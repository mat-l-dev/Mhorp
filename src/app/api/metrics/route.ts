// src/app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import { exportPrometheusMetrics, metrics } from '@/lib/monitoring/metrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/metrics
 * Endpoint para exportar métricas en formato Prometheus
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'prometheus';

  if (format === 'prometheus') {
    const prometheusMetrics = exportPrometheusMetrics();
    
    return new Response(prometheusMetrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
      },
    });
  }

  // Formato JSON
  const allMetrics = metrics.getAllMetrics();
  
  // Convertir Maps a Objects para JSON
  const jsonMetrics = {
    counters: Object.fromEntries(allMetrics.counters),
    gauges: Object.fromEntries(allMetrics.gauges),
    histograms: Object.fromEntries(allMetrics.histograms),
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(jsonMetrics);
}
