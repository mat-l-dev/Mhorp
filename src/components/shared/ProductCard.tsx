// src/components/shared/ProductCard.tsx
// Propósito: Componente reutilizable para mostrar un producto en una tarjeta.

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { products } from '@/lib/db/schema';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import AddToCartButton from './AddToCartButton';

type ProductCardProps = {
  product: typeof products.$inferSelect;
};

export default function ProductCard({ product }: ProductCardProps) {
  const isLowStock = product.stock !== null && product.stock > 0 && product.stock < 5;
  const isOutOfStock = product.stock === 0;

  return (
    <Card className="group h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col border-muted">
      <Link href={`/product/${product.id}`} className="flex-1 flex flex-col">
        <CardHeader className="p-0 relative">
          <div className="relative w-full aspect-square bg-muted overflow-hidden">
            <Image
              src={product.images?.[0] || '/placeholders/placeholder.png'}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge variant="destructive" className="text-sm">
                  Agotado
                </Badge>
              </div>
            )}
            {isLowStock && !isOutOfStock && (
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="bg-orange-500/90 text-white border-orange-600">
                  Últimas unidades
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {product.description}
            </p>
          )}
          
          <div className="mt-auto">
            <p className="text-2xl font-bold text-primary">
              S/ {parseFloat(product.price).toFixed(2)}
            </p>
            {product.stock !== null && product.stock > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Stock: {product.stock} unidades
              </p>
            )}
          </div>
        </CardContent>
      </Link>
      
      <CardFooter className="p-4 pt-0">
        <AddToCartButton product={product} />
      </CardFooter>
    </Card>
  );
}
