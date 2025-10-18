'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Tag } from 'lucide-react';

interface RecentSale {
  date: string;
  revenue: number;
  orders: number;
}

interface Coupon {
  id: number;
  code: string;
  uses: number;
  totalDiscount: number;
}

interface SalesAndCouponsProps {
  recentSales: RecentSale[];
  mostUsedCoupons: Coupon[];
  wishlistConversion: {
    rate: number;
    usersWithWishlist: number;
    usersPurchased: number;
  };
}

export function SalesAndCouponsSection({ recentSales, mostUsedCoupons, wishlistConversion }: SalesAndCouponsProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Conversión de Wishlist */}
      <Card>
        <CardHeader>
          <CardTitle>Conversión de Wishlist a Compra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Usuarios con wishlist</span>
              <span className="font-semibold">{wishlistConversion.usersWithWishlist}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Usuarios que compraron</span>
              <span className="font-semibold">{wishlistConversion.usersPurchased}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tasa de Conversión</span>
                <span className="text-2xl font-bold text-green-600">
                  {wishlistConversion.rate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ventas Recientes */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Ventas de los Últimos 30 Días
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {recentSales.slice(0, 15).map((sale, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">{formatDate(sale.date)}</span>
                  <span className="text-xs text-muted-foreground">{sale.orders} órdenes</span>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  S/ {sale.revenue.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cupones Más Usados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-indigo-600" />
            Top 5 Cupones Más Usados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mostUsedCoupons.map((coupon, index) => (
              <div key={coupon.id} className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-muted-foreground">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium leading-none font-mono">{coupon.code}</p>
                    <p className="text-xs text-muted-foreground mt-1">{coupon.uses} usos</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-red-600">
                  -S/ {coupon.totalDiscount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
