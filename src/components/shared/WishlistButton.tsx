// src/components/shared/WishlistButton.tsx
// Propósito: Botón para agregar/quitar productos de la lista de deseos
'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { addToWishlist, removeFromWishlist } from '@/actions/wishlist';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type WishlistButtonProps = {
  productId: number;
  isInWishlist: boolean;
  variant?: 'default' | 'icon';
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

export default function WishlistButton({
  productId,
  isInWishlist: initialIsInWishlist,
  variant = 'default',
  size = 'default',
}: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(initialIsInWishlist);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleToggle = () => {
    startTransition(async () => {
      if (isInWishlist) {
        const result = await removeFromWishlist(productId);
        if (result.success) {
          setIsInWishlist(false);
          toast({
            title: 'Eliminado',
            description: result.success,
          });
        } else if (result.error) {
          toast({
            title: 'Error',
            description: result.error,
            variant: 'destructive',
          });
        }
      } else {
        const result = await addToWishlist(productId);
        if (result.success) {
          setIsInWishlist(true);
          toast({
            title: '¡Agregado!',
            description: result.success,
          });
        } else if (result.error) {
          toast({
            title: 'Error',
            description: result.error,
            variant: 'destructive',
          });
        }
      }
    });
  };

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={handleToggle}
        disabled={isPending}
        className="relative"
      >
        <Heart
          className={cn(
            'h-5 w-5 transition-all',
            isInWishlist && 'fill-red-500 text-red-500',
            isPending && 'opacity-50'
          )}
        />
      </Button>
    );
  }

  return (
    <Button
      variant={isInWishlist ? 'secondary' : 'outline'}
      size={size}
      onClick={handleToggle}
      disabled={isPending}
      className="gap-2"
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-all',
          isInWishlist && 'fill-red-500 text-red-500'
        )}
      />
      {isInWishlist ? 'En tu lista' : 'Agregar a lista'}
    </Button>
  );
}
