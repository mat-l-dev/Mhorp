// src/app/(admin)/admin/dashboard/page.tsx
// Propósito: Dashboard principal del administrador con métricas reales
import { getDashboardMetrics, getRecentOrders } from '@/actions/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  DollarSign, 
  AlertTriangle,
  Clock 
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function AdminDashboardPage() {
  const metricsResult = await getDashboardMetrics();
  const ordersResult = await getRecentOrders(5);

  if ('error' in metricsResult) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error al cargar el dashboard</p>
      </div>
    );
  }

  const {
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    lowStockProducts,
  } = metricsResult;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard de Administración</h1>
        <p className="text-muted-foreground">
          Vista general de tu negocio en Mhorp
        </p>
      </div>

      {/* Métricas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              De pedidos completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Todos los estados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              En catálogo
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingOrders}</div>
            <p className="text-xs text-orange-700">
              Requieren revisión
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockProducts}</div>
            <p className="text-xs text-red-700">
              Menos de 5 unidades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pedidos Recientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pedidos Recientes</CardTitle>
              <CardDescription>Los últimos 5 pedidos realizados</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/orders">Ver todos</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ordersResult.orders && ordersResult.orders.length > 0 ? (
            <div className="space-y-4">
              {ordersResult.orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">Pedido #{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.user?.name || order.user?.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">S/ {order.total}</p>
                    <p className="text-sm text-muted-foreground">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No hay pedidos recientes
            </p>
          )}
        </CardContent>
      </Card>

      {/* Acciones Rápidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button asChild variant="outline" className="h-20">
          <Link href="/admin/orders">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Gestionar Pedidos
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-20">
          <Link href="/admin/products">
            <Package className="mr-2 h-5 w-5" />
            Gestionar Productos
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-20">
          <Link href="/admin/categories">
            <Users className="mr-2 h-5 w-5" />
            Gestionar Categorías
          </Link>
        </Button>
      </div>
    </div>
  );
}
