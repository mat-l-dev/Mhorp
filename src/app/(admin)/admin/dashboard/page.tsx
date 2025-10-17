// src/app/(admin)/admin/dashboard/page.tsx
// Propósito: Dashboard principal del administrador
export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard de Administración</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Pedidos Pendientes</h3>
          <p className="text-3xl font-bold text-blue-600">-</p>
          <p className="text-sm text-blue-700 mt-2">Requieren revisión</p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Pedidos Procesados</h3>
          <p className="text-3xl font-bold text-green-600">-</p>
          <p className="text-sm text-green-700 mt-2">En este mes</p>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">Productos Activos</h3>
          <p className="text-3xl font-bold text-purple-600">-</p>
          <p className="text-sm text-purple-700 mt-2">En catálogo</p>
        </div>
      </div>
      
      <div className="mt-8 bg-muted/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Métricas y estadísticas</h2>
        <p className="text-muted-foreground">
          Esta sección mostrará gráficos y estadísticas detalladas en futuras versiones.
        </p>
      </div>
    </div>
  );
}
