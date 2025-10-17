// src/components/shared/CartHydrator.tsx
// Propósito: Sincroniza el carrito del servidor con el estado local de Zustand
// Se ejecuta una sola vez al montar el componente en el layout

'use client';

import { useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/store/cart';
import type { CartItem } from '@/lib/store/cart';

type CartHydratorProps = {
  serverCart: CartItem[] | null;
};

export default function CartHydrator({ serverCart }: CartHydratorProps) {
  const setItems = useCartStore((state) => state.setItems);
  const hasHydrated = useRef(false);

  useEffect(() => {
    // Evitar múltiples hidraciones
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    // Sincronizar carrito del servidor con el estado local
    if (serverCart && serverCart.length > 0) {
      setItems(serverCart);
    }
  }, [serverCart, setItems]);

  // No renderiza nada, solo sincroniza el estado
  return null;
}
