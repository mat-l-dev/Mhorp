// src/app/(store)/account/wishlist/page.tsx
// Propósito: Página de lista de deseos del usuario
import { getUserWishlist } from '@/actions/wishlist';
import { getUserSharedWishlists } from '@/actions/shared-wishlist';
import ProductCard from '@/components/shared/ProductCard';
import { ShareWishlistButton } from '@/components/shared/ShareWishlistButton';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Mi Lista de Deseos - Mhorp',
  description: 'Productos guardados en tu lista de deseos',
};

export default async function WishlistPage() {
  const [wishlistItems, sharedWishlists] = await Promise.all([
    getUserWishlist(),
    getUserSharedWishlists(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Heart className="h-8 w-8 fill-red-500 text-red-500" />
              Mi Lista de Deseos
            </h1>
            <p className="text-muted-foreground">
              {wishlistItems.length === 0
                ? 'Aún no tienes productos guardados'
                : `${wishlistItems.length} ${wishlistItems.length === 1 ? 'producto guardado' : 'productos guardados'}`}
            </p>
          </div>
          {wishlistItems.length > 0 && (
            <ShareWishlistButton existingShares={sharedWishlists} />
          )}
        </div>
      </div>

      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Heart className="h-20 w-20 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h2 className="text-2xl font-semibold mb-2">Tu lista está vacía</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Guarda productos que te interesen para encontrarlos más tarde fácilmente
          </p>
          <Button asChild>
            <Link href="/">Explorar Productos</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
