// src/components/shared/ProductCard.tsx
// Propósito: Componente reutilizable para mostrar un producto en una tarjeta.

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { products } from '@/lib/db/schema';
import Image from 'next/image';

type ProductCardProps = {
  product: typeof products.$inferSelect;
};

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/product/${product.id}`}>
      <Card className="h-full overflow-hidden transition-shadow duration-300 hover:shadow-lg">
        <CardHeader className="p-0">
          <div className="relative w-full aspect-square">
            <Image
              src={product.images?.[0] || '/placeholders/placeholder.png'}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-lg font-semibold">{product.name}</CardTitle>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <p className="text-xl font-bold text-primary">S/ {product.price}</p>
        </CardFooter>
      </Card>
    </Link>
  );
}
