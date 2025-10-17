// src/app/(admin)/products/page.tsx
// Propósito: Página de administración de productos (crear, editar, eliminar).

export default function ProductsAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Productos</h1>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90">
          + Nuevo Producto
        </button>
      </div>
      <div className="bg-card border rounded-lg">
        <div className="p-6">
          <p className="text-muted-foreground">No hay productos registrados</p>
          {/* TODO: Implementar tabla de productos con acciones de editar/eliminar */}
        </div>
      </div>
    </div>
  );
}
