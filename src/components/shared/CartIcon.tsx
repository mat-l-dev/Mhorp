// src/components/shared/CartIcon.tsx
// Propósito: Icono del carrito con contador de items
// Se hidrata con useEffect para evitar mismatch con el servidor

'use client';

import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/lib/store/cart';
import { useEffect, useState } from 'react';

export default function CartIcon() {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((state) => state.items);
  
  // Evitar mismatch de hidratación entre servidor y cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Link 
      href="/cart" 
      className="relative inline-flex items-center justify-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <ShoppingCart className="h-5 w-5" />
      {mounted && itemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
      <span className="sr-only">Carrito de compras</span>
    </Link>
  );
}
