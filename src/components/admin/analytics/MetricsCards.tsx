'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingCart, Package, Users, Star, Heart, Tag, DollarSign } from 'lucide-react';

interface MetricsCardsProps {
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    totalProducts: number;
    totalUsers: number;
    totalReviews: number;
    avgRating: number;
    totalWishlistItems: number;
    activeCoupons: number;
    avgTicket: number;
  };
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const kpiCards = [
    {
      title: 'Ingresos Totales',
      value: `S/ ${metrics.totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Total de Órdenes',
      value: metrics.totalOrders,
      icon: ShoppingCart,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Ticket Promedio',
      value: `S/ ${metrics.avgTicket.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Usuarios Registrados',
      value: metrics.totalUsers,
      icon: Users,
      color: 'text-orange-600 dark:text-orange-400',
    },
  ];

  const engagementCards = [
    {
      title: 'Total de Reseñas',
      value: metrics.totalReviews,
      subtitle: `Promedio: ${metrics.avgRating} ⭐`,
      icon: Star,
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'Items en Wishlist',
      value: metrics.totalWishlistItems,
      icon: Heart,
      color: 'text-red-600 dark:text-red-400',
    },
    {
      title: 'Cupones Activos',
      value: metrics.activeCoupons,
      icon: Tag,
      color: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'Órdenes Pendientes',
      value: metrics.pendingOrders,
      icon: Package,
      color: 'text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <>
      {/* KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Métricas de Engagement */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Métricas de Engagement</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {engagementCards.map((card, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
