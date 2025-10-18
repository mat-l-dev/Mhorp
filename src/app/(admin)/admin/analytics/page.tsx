import { Metadata } from 'next';
import {
  getAnalyticsMetrics,
  getTopSellingProducts,
  getMostWishedProducts,
  getTopRatedProducts,
  getRecentSales,
  getWishlistConversionRate,
  getMostUsedCoupons,
} from '@/actions/analytics';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Users, 
  Star, 
  Heart, 
  Tag,
  DollarSign,
  Clock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Analytics - Panel de Administración',
  description: 'Métricas y estadísticas del negocio',
};

export default async function AnalyticsPage() {
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

      {/* KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Ingresos Totales"
          value={`$${metrics.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          icon={<DollarSign className="h-5 w-5" />}
          description="Ventas totales"
          trend={metrics.totalRevenue > 0 ? 'up' : 'neutral'}
        />
        <MetricCard
          title="Órdenes"
          value={metrics.totalOrders.toString()}
          icon={<ShoppingCart className="h-5 w-5" />}
          description={`${metrics.pendingOrders} pendientes`}
          trend={metrics.totalOrders > 0 ? 'up' : 'neutral'}
        />
        <MetricCard
          title="Ticket Promedio"
          value={`$${metrics.avgTicket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          icon={<TrendingUp className="h-5 w-5" />}
          description="Por orden"
          trend={metrics.avgTicket > 0 ? 'up' : 'neutral'}
        />
        <MetricCard
          title="Usuarios"
          value={metrics.totalUsers.toString()}
          icon={<Users className="h-5 w-5" />}
          description="Registrados"
          trend={metrics.totalUsers > 0 ? 'up' : 'neutral'}
        />
      </div>

      {/* Engagement Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Reseñas"
          value={metrics.totalReviews.toString()}
          icon={<Star className="h-5 w-5" />}
          description={`${metrics.avgRating} ⭐ promedio`}
          trend="up"
        />
        <MetricCard
          title="Items en Wishlist"
          value={metrics.totalWishlistItems.toString()}
          icon={<Heart className="h-5 w-5" />}
          description={`${wishlistConversion.rate}% conversión`}
          trend="up"
        />
        <MetricCard
          title="Cupones Activos"
          value={metrics.activeCoupons.toString()}
          icon={<Tag className="h-5 w-5" />}
          description="Disponibles"
          trend="neutral"
        />
      </div>

      {/* Productos Top */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Más Vendidos */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Productos Más Vendidos</h3>
          </div>
          <div className="space-y-4">
            {topSellingProducts.length > 0 ? (
              topSellingProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.totalSold} unidades vendidas
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">
                    ${product.revenue.toLocaleString('es-MX')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay ventas registradas
              </p>
            )}
          </div>
        </div>

        {/* Mejor Calificados */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold">Productos Mejor Calificados</h3>
          </div>
          <div className="space-y-4">
            {topRatedProducts.length > 0 ? (
              topRatedProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-sm font-semibold text-yellow-700">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.reviewCount} reseñas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-yellow-600">
                    <Star className="h-4 w-4 fill-yellow-600" />
                    {product.avgRating}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay reseñas suficientes
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Wishlist y Cupones */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Más Deseados */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold">Productos Más Deseados</h3>
          </div>
          <div className="space-y-4">
            {mostWishedProducts.length > 0 ? (
              mostWishedProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-700">
                      {index + 1}
                    </div>
                    <p className="font-medium">{product.name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-red-600 font-semibold">
                    <Heart className="h-4 w-4 fill-red-600" />
                    {product.count}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay items en wishlist
              </p>
            )}
          </div>
        </div>

        {/* Cupones Más Usados */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Cupones Más Utilizados</h3>
          </div>
          <div className="space-y-4">
            {mostUsedCoupons.length > 0 ? (
              mostUsedCoupons.map((coupon, index) => (
                <div key={coupon.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium font-mono">{coupon.code}</p>
                      <p className="text-sm text-muted-foreground">
                        {coupon.uses} usos
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-blue-600">
                    -${coupon.totalDiscount.toLocaleString('es-MX')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay cupones utilizados
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Ventas Recientes */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Ventas de los Últimos 30 Días</h3>
        </div>
        <div className="space-y-2">
          {recentSales.length > 0 ? (
            <div className="grid grid-cols-7 gap-2">
              {recentSales.slice(-7).map((sale) => (
                <div key={sale.date} className="text-center">
                  <div className="rounded-lg border bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      {new Date(sale.date).toLocaleDateString('es-MX', { 
                        day: '2-digit',
                        month: 'short' 
                      })}
                    </p>
                    <p className="text-sm font-semibold">
                      ${sale.revenue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sale.orders} órdenes
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No hay ventas en los últimos 30 días
            </p>
          )}
        </div>
      </div>

      {/* Conversión Wishlist */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Conversión de Wishlist</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-orange-600">
              {wishlistConversion.usersWithWishlist}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Usuarios con wishlist
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">
              {wishlistConversion.usersPurchased}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Compraron desde wishlist
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-600">
              {wishlistConversion.rate}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Tasa de conversión
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  trend: 'up' | 'down' | 'neutral';
}

function MetricCard({ title, value, icon, description, trend }: MetricCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-muted-foreground',
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="rounded-full bg-primary/10 p-2">
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold">{value}</p>
        <p className={`text-sm mt-1 ${trendColors[trend]}`}>
          {description}
        </p>
      </div>
    </div>
  );
}
