// src/components/shared/AddToCartButton.tsx
// Propósito: Botón para añadir productos al carrito con UI optimista y feedback visual
'use client';

import { Button } from '@/components/ui/button';
import { products } from '@/lib/db/schema';
import { useCartStore } from '@/lib/store/cart';
import { addToCart } from '@/actions/cart';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';

type AddToCartButtonProps = {
  product: typeof products.$inferSelect;
};

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { addItem } = useCartStore();

  const handleAddToCart = () => {
    // UI Optimista: actualiza inmediatamente el estado local
    addItem(product);
    toast.success(`${product.name} añadido al carrito.`);

    // Sincronización con el servidor en segundo plano
    startTransition(async () => {
      const result = await addToCart(product.id);
      if (result?.error) {
        toast.error(result.error);
        // TODO: implementar lógica para revertir la adición si falla el servidor
      }
    });
  };

  return (
    <Button 
      size="lg" 
      className="w-full" 
      onClick={handleAddToCart} 
      disabled={isPending}
    >
      <ShoppingCart className="mr-2 h-5 w-5" />
      {isPending ? 'Añadiendo...' : 'Añadir al Carrito'}
    </Button>
  );
}
