import { NextRequest, NextResponse } from 'next/server';
import { clearAllCache, getCacheStats, invalidateCacheByTag } from '@/lib/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * API para gestión de caché
 * Requiere autenticación como admin
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y rol de admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que sea admin (necesitarías una query a la DB)
    // Por ahora, verifica con un header de autorización
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { action, tag } = body;

    switch (action) {
      case 'clear-all':
        await clearAllCache();
        return NextResponse.json({ 
          success: true, 
          message: 'Todo el caché ha sido limpiado' 
        });

      case 'clear-tag':
        if (!tag) {
          return NextResponse.json({ 
            error: 'Tag es requerido para clear-tag' 
          }, { status: 400 });
        }
        await invalidateCacheByTag(tag);
        return NextResponse.json({ 
          success: true, 
          message: `Caché del tag "${tag}" limpiado` 
        });

      case 'stats':
        const stats = await getCacheStats();
        return NextResponse.json({ 
          success: true, 
          stats 
        });

      default:
        return NextResponse.json({ 
          error: 'Acción inválida. Use: clear-all, clear-tag, o stats' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[CACHE API ERROR]', error);
    return NextResponse.json(
      { error: 'Error al gestionar el caché' },
      { status: 500 }
    );
  }
}

/**
 * GET para obtener estadísticas del caché
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const stats = await getCacheStats();
    
    return NextResponse.json({
      success: true,
      stats,
      tags: ['analytics', 'products', 'metrics', 'sales'],
    });
  } catch (error) {
    console.error('[CACHE API ERROR]', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
