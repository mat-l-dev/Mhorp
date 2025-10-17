// src/app/(store)/layout.tsx
// Propósito: Layout principal para todas las páginas de la tienda.

import Navbar from '@/components/shared/Navbar';
import CartHydrator from '@/components/shared/CartHydrator';
import { Toaster } from '@/components/ui/sonner';
import { getCart } from '@/actions/cart';

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const serverCart = await getCart();

  return (
    <div>
      <Navbar />
      <CartHydrator serverCart={serverCart} />
      <main>{children}</main>
      <Toaster richColors position="top-right" />
      {/* Aquí irá el Footer en el futuro */}
    </div>
  );
}
