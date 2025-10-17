// src/app/(store)/order-confirmation/[orderId]/page.tsx
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

async function getOrderDetails(orderId: string) {
  return await db.query.orders.findFirst({
    where: eq(orders.id, parseInt(orderId)),
  });
}

export default async function OrderConfirmationPage({ params }: { params: { orderId: string } }) {
  const order = await getOrderDetails(params.orderId);

  if (!order) {
    notFound();
  }

  return (
    <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      <h1 className="text-4xl font-bold text-green-600 mb-4">¡Gracias por tu Pedido!</h1>
      <p className="text-lg mb-2">Tu pedido <span className="font-mono bg-muted p-1 rounded-md">{order.id}</span> ha sido recibido.</p>
      <p className="text-muted-foreground mb-8">El estado de tu pedido es: <span className="font-semibold">{order.status}</span>.</p>

      <div className="bg-muted p-6 rounded-lg text-left">
        <h2 className="text-2xl font-semibold mb-4">Siguientes Pasos</h2>
        <p className="mb-2">Para completar tu compra, por favor realiza el pago de <span className="font-bold">S/ {order.total}</span> a través de:</p>
        <ul className="list-disc list-inside mb-4">
          <li>Yape o Plin al número: <strong>999-888-777</strong></li>
          <li>Transferencia BCP: <strong>123-4567890-1-23</strong></li>
        </ul>
        <p className="font-semibold">
          Una vez realizado el pago, sube tu comprobante en la sección "Mis Pedidos" de tu cuenta.
        </p>
        {/* Aquí, en el futuro, irá el componente para subir el comprobante */}
      </div>
    </section>
  );
}
