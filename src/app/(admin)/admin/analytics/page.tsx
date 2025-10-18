import { Metadata } from 'next';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
  getAnalyticsMetrics,
  getTopSellingProducts,
  getMostWishedProducts,
  getTopRatedProducts,
  getRecentSales,
  getWishlistConversionRate,
  getMostUsedCoupons,
} from '@/actions/analytics';

// Lazy load heavy components
const MetricsCards = dynamic(() => import('@/components/admin/analytics/MetricsCards').then(mod => ({ default: mod.MetricsCards })), {
  loading: () => <div className="h-40 animate-pulse bg-muted rounded-lg" />,
  ssr: false, // Solo en cliente para reducir bundle del servidor
});

const TopProductsSection = dynamic(() => import('@/components/admin/analytics/TopProductsSection').then(mod => ({ default: mod.TopProductsSection })), {
  loading: () => <div className="h-80 animate-pulse bg-muted rounded-lg" />,
  ssr: false,
});

const SalesAndCouponsSection = dynamic(() => import('@/components/admin/analytics/SalesAndCouponsSection').then(mod => ({ default: mod.SalesAndCouponsSection })), {
  loading: () => <div className="h-60 animate-pulse bg-muted rounded-lg" />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'Analytics - Panel de Administración',
  description: 'Métricas y estadísticas del negocio',
};

export default async function AnalyticsPage() {
  // Fetch data on server
  const [
    metrics,
    topSellingProducts,
    mostWishedProducts,
    topRatedProducts,
    recentSales,
    wishlistConversion,
    mostUsedCoupons,
  ] = await Promise.all([
    getAnalyticsMetrics(),
    getTopSellingProducts(),
    getMostWishedProducts(),
    getTopRatedProducts(),
    getRecentSales(),
    getWishlistConversionRate(),
    getMostUsedCoupons(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Métricas y estadísticas de tu negocio
        </p>
      </div>

      {/* KPIs Principales - Lazy loaded */}
      <Suspense fallback={<div className="h-40 animate-pulse bg-muted rounded-lg" />}>
        <MetricsCards metrics={metrics} />
      </Suspense>

      {/* Top Products - Lazy loaded */}
      <Suspense fallback={<div className="h-80 animate-pulse bg-muted rounded-lg" />}>
        <TopProductsSection
          topSellingProducts={topSellingProducts}
          mostWishedProducts={mostWishedProducts}
          topRatedProducts={topRatedProducts}
        />
      </Suspense>

      {/* Sales and Coupons - Lazy loaded */}
      <Suspense fallback={<div className="h-60 animate-pulse bg-muted rounded-lg" />}>
        <SalesAndCouponsSection
          recentSales={recentSales}
          mostUsedCoupons={mostUsedCoupons}
          wishlistConversion={wishlistConversion}
        />
      </Suspense>
    </div>
  );
}
