// src/app/(store)/product/[slug]/page.tsx
// Propósito: Página de detalle de producto individual (Product Detail Page - PDP).

import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { ShareButtons } from '@/components/shared/ShareButtons';
import WishlistButton from '@/components/shared/WishlistButton';
import ReviewForm from '@/components/shared/ReviewForm';
import ProductReviewsList from '@/components/shared/ProductReviewsList';
import { getProductRating } from '@/actions/review';
import { isInWishlist } from '@/actions/wishlist';
import StarRating from '@/components/shared/StarRating';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  
  // El slug puede ser el ID o un slug real
  const productId = parseInt(slug);
  
  if (isNaN(productId)) {
    notFound();
  }

  // Obtener producto
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    with: {
      category: true,
    },
  });

  if (!product) {
    notFound();
  }

  // Obtener rating promedio y wishlist status
  const [ratingData, inWishlist] = await Promise.all([
    getProductRating(productId),
    isInWishlist(productId),
  ]);
  
  const { average: avgRating, count: reviewCount } = ratingData;
  const price = parseFloat(product.price);
  const hasStock = (product.stock ?? 0) > 0;
  const images = (product.images as string[]) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Imágenes del producto */}
        <div className="space-y-4">
          {images.length > 0 ? (
            <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
              <Image
                src={images[0]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Sin imagen</p>
            </div>
          )}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1, 5).map((img, idx) => (
                <div key={idx} className="aspect-square relative bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={img}
                    alt={`${product.name} - imagen ${idx + 2}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            {product.category && (
              <p className="text-muted-foreground">{product.category.name}</p>
            )}
          </div>

          {/* Rating */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-3">
              <StarRating rating={avgRating} readonly />
              <span className="text-sm text-muted-foreground">
                {avgRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'})
              </span>
            </div>
          )}

          {/* Precio */}
          <div className="text-4xl font-bold text-primary">
            ${price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>

          {/* Stock */}
          <div>
            {hasStock ? (
              <p className="text-green-600 font-medium">
                ✓ En stock ({product.stock} disponibles)
              </p>
            ) : (
              <p className="text-red-600 font-medium">✗ Sin stock</p>
            )}
          </div>

          {/* Descripción */}
          {product.description && (
            <div>
              <h3 className="font-semibold mb-2">Descripción</h3>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3">
            <Button
              size="lg"
              disabled={!hasStock}
              className="flex-1"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Agregar al Carrito
            </Button>
            <WishlistButton productId={productId} isInWishlist={inWishlist} variant="icon" size="icon" />
            <ShareButtons
              productId={productId.toString()}
              productName={product.name}
              productPrice={price}
              productImage={images[0]}
            />
          </div>
        </div>
      </div>

      {/* Sección de Reseñas */}
      <div className="border-t pt-12">
        <h2 className="text-2xl font-bold mb-6">
          Reseñas de Clientes
          {reviewCount > 0 && (
            <span className="text-muted-foreground text-lg ml-2">
              ({reviewCount})
            </span>
          )}
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Formulario de reseña */}
          <div className="md:col-span-1">
            <div className="sticky top-4">
              <ReviewForm productId={productId} />
            </div>
          </div>

          {/* Lista de reseñas */}
          <div className="md:col-span-2">
            <ProductReviewsList productId={productId} />
          </div>
        </div>
      </div>
    </div>
  );
}
