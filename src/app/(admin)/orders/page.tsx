// src/app/(admin)/orders/page.tsx
// Propósito: Página de administración de pedidos (ver, actualizar estado).

export default function OrdersAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Pedidos</h1>
        <div className="flex gap-2">
          {/* TODO: Agregar filtros por estado */}
          <select className="px-4 py-2 border rounded-md">
            <option>Todos los pedidos</option>
            <option>Pendientes</option>
            <option>En proceso</option>
            <option>Completados</option>
          </select>
        </div>
      </div>
      <div className="bg-card border rounded-lg">
        <div className="p-6">
          <p className="text-muted-foreground">No hay pedidos registrados</p>
          {/* TODO: Implementar tabla de pedidos con detalles y acciones */}
        </div>
      </div>
    </div>
  );
}
