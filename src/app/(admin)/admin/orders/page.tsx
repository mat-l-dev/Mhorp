// src/app/(admin)/admin/orders/page.tsx
// Propósito: Vista de pedidos pendientes para el administrador
import { getPendingOrders } from '@/actions/order';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import ProofManager from '@/components/admin/ProofManager';

export default async function AdminOrdersPage() {
  const result = await getPendingOrders();

  if (result.error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{result.error}</p>
      </div>
    );
  }

  const orders = result.orders || [];

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">No hay pedidos pendientes</h2>
        <p className="text-muted-foreground">
          Todos los pedidos han sido procesados. ¡Buen trabajo!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Pedidos Pendientes de Confirmación</h1>
        <p className="text-muted-foreground mt-2">
          {orders.length} {orders.length === 1 ? 'pedido requiere' : 'pedidos requieren'} tu revisión
        </p>
      </div>

      <div className="grid gap-6">
        {orders.map((order) => {
          const proof = order.paymentProofs?.[0]; // Tomar el comprobante más reciente
          
          return (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Pedido #{order.id}</CardTitle>
                    <CardDescription className="mt-2">
                      Cliente: <strong>{order.user?.email || 'No disponible'}</strong>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">S/ {order.total}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Detalles del Pedido</h3>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Dirección:</span> {order.shippingAddress}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Ciudad:</span> {order.shippingCity}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Teléfono:</span> {order.shippingPhone}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Estado:</span>{' '}
                      <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">
                        {order.status}
                      </span>
                    </p>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Productos</h3>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm bg-muted/30 p-2 rounded">
                          <span>
                            {item.product?.name || 'Producto'} x {item.quantity}
                          </span>
                          <span className="font-medium">S/ {item.priceAtPurchase}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {proof ? (
                  <ProofManager order={order} proof={proof} />
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Este pedido no tiene comprobantes pendientes de revisión.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
