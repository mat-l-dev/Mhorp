'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Heart, Star, Tag } from 'lucide-react';

interface TopProduct {
  id: number;
  name: string;
  totalSold?: number;
  revenue?: number;
  count?: number;
  avgRating?: number;
  reviewCount?: number;
}

interface TopProductsProps {
  topSellingProducts: TopProduct[];
  mostWishedProducts: TopProduct[];
  topRatedProducts: TopProduct[];
}

export function TopProductsSection({ topSellingProducts, mostWishedProducts, topRatedProducts }: TopProductsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Top Productos Más Vendidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Top 5 Más Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topSellingProducts.map((product, index) => (
              <div key={product.id} className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-muted-foreground">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium leading-none">{product.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {product.totalSold} vendidos
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  S/ {product.revenue?.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Productos Mejor Calificados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-600" />
            Top 5 Mejor Calificados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topRatedProducts.map((product, index) => (
              <div key={product.id} className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-muted-foreground">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium leading-none">{product.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {product.reviewCount} reseñas
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-yellow-600">
                  {product.avgRating} ⭐
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Productos Más en Wishlist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-600" />
            Top 5 Más en Wishlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mostWishedProducts.map((product, index) => (
              <div key={product.id} className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-muted-foreground">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium leading-none">{product.name}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-red-600">
                  {product.count} ❤️
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
