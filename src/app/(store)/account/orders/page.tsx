// src/app/(store)/account/orders/page.tsx
'use client';

import { getUserOrders } from '@/actions/order';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import UploadProofForm from '@/components/shared/UploadProofForm';
import { useEffect, useState } from 'react';

type Order = {
  id: number;
  userId: string;
  total: string;
  status: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string | null;
  shippingPhone: string;
  paymentProofUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: unknown[];
  paymentProofs: unknown[];
};

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      const result = await getUserOrders();
      if (result.error) {
        setError(result.error);
      } else if (result.orders) {
        setOrders(result.orders);
      }
      setIsLoading(false);
    }
    loadOrders();
  }, []);

  if (isLoading) {
    return <p className="text-center">Cargando pedidos...</p>;
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">No tienes pedidos</h2>
        <p className="text-muted-foreground">Empieza a comprar para ver tus pedidos aquí.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis Pedidos</CardTitle>
        <CardDescription>Un resumen de tus compras recientes.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido ID</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">{order.id}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>S/ {order.total}</TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {order.status === 'awaiting_payment' && (
                    <UploadProofForm orderId={order.id.toString()} />
                  )}
                  {order.status === 'awaiting_confirmation' && (
                    <span className="text-sm text-amber-600">En revisión</span>
                  )}
                  {order.status !== 'awaiting_payment' && order.status !== 'awaiting_confirmation' && (
                    <span className="text-sm text-green-600">Procesado</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
