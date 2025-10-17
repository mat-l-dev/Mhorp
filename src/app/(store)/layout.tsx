// src/app/(store)/layout.tsx
// Propósito: Layout principal para todas las páginas de la tienda.

import Navbar from '@/components/shared/Navbar';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Navbar />
      <main>{children}</main>
      {/* Aquí irá el Footer en el futuro */}
    </div>
  );
}
