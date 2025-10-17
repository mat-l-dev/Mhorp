// src/components/shared/Navbar.tsx
// Propósito: Barra de navegación principal del sitio.

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="w-full border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold">
              Mhorp
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/cart" className="hover:underline">
              Carrito
            </Link>
            <Link href="/login" className="hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
