// src/app/(admin)/dashboard/page.tsx
// Propósito: Panel principal de administración con métricas y resumen general.

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* TODO: Implementar tarjetas de métricas */}
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Total Ventas</p>
          <p className="text-3xl font-bold mt-2">$0.00</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Pedidos</p>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Productos</p>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Clientes</p>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
      </div>
      {/* TODO: Implementar gráficos y tablas de datos */}
    </div>
  );
}
