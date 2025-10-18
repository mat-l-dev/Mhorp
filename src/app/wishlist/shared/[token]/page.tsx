import { getSharedWishlist } from '@/actions/shared-wishlist';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Heart, Eye, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Metadata } from 'next';

interface SharedWishlistPageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({ params }: SharedWishlistPageProps): Promise<Metadata> {
  const { token } = await params;
  const result = await getSharedWishlist(token);

  if ('error' in result || !result.success) {
    return {
      title: 'Wishlist no encontrada',
    };
  }

  return {
    title: `${result.wishlist.name} - Lista de Deseos de ${result.wishlist.ownerName}`,
    description: result.wishlist.description || `Descubre los productos favoritos de ${result.wishlist.ownerName}`,
  };
}

export default async function SharedWishlistPage({ params }: SharedWishlistPageProps) {
  const { token } = await params;
  const result = await getSharedWishlist(token);

  if ('error' in result || !result.success) {
    notFound();
  }

  const { wishlist, products } = result;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <User className="h-4 w-4" />
            <span>Lista de deseos de <strong>{wishlist.ownerName}</strong></span>
          </div>

          <h1 className="text-4xl font-bold">
            <Heart className="inline h-8 w-8 text-red-500 fill-red-500 mr-2" />
            {wishlist.name}
          </h1>

          {wishlist.description && (
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {wishlist.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{wishlist.viewCount} {wishlist.viewCount === 1 ? 'vista' : 'vistas'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                Creada {formatDistanceToNow(new Date(wishlist.createdAt), { addSuffix: true, locale: es })}
              </span>
            </div>
            {wishlist.expiresAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Expira {formatDistanceToNow(new Date(wishlist.expiresAt), { addSuffix: true, locale: es })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {products.map((product) => {
            const price = parseFloat(product.price);
            const images = (product.images as string[]) || [];
            const hasStock = (product.stock ?? 0) > 0;

            return (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Image */}
                <div className="aspect-square relative bg-muted">
                  {images[0] ? (
                    <Image
                      src={images[0]}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Heart className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  {!hasStock && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-semibold">Agotado</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-primary">
                      ${price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    {hasStock && (
                      <span className="text-xs text-green-600 font-medium">
                        ✓ En stock
                      </span>
                    )}
                  </div>

                  <Button 
                    variant={hasStock ? "default" : "secondary"} 
                    className="w-full"
                    disabled={!hasStock}
                  >
                    {hasStock ? 'Ver Producto' : 'Sin Stock'}
                  </Button>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-xl font-semibold mb-2">No hay productos en esta wishlist</h3>
          <p className="text-muted-foreground">
            Esta lista de deseos está vacía por el momento.
          </p>
        </div>
      )}

      {/* CTA */}
      <div className="max-w-2xl mx-auto mt-12 text-center space-y-4 p-6 border rounded-lg bg-muted/30">
        <h3 className="text-xl font-semibold">¿Te gustó esta wishlist?</h3>
        <p className="text-muted-foreground">
          Crea tu propia lista de deseos y compártela con amigos y familia
        </p>
        <Link href="/account/wishlist">
          <Button size="lg" className="gap-2">
            <Heart className="h-5 w-5" />
            Crear Mi Wishlist
          </Button>
        </Link>
      </div>
    </div>
  );
}
