// src/components/shared/Navbar.tsx
// Propósito: Componente de barra de navegación principal compartido en toda la aplicación.

export default function Navbar() {
  return (
    <nav className="w-full border-b bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold">Mhorp</h1>
          {/* TODO: Agregar enlaces de navegación */}
        </div>
        <div className="flex items-center gap-4">
          {/* TODO: Agregar carrito y menú de usuario */}
        </div>
      </div>
    </nav>
  );
}
