// src/app/(store)/checkout/page.tsx
'use client';

import { useCartStore } from '@/lib/store/cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createOrder } from '@/actions/order';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const subtotal = items.reduce((acc, item) => {
    const price = parseFloat(item.product.price || '0');
    return acc + price * item.quantity;
  }, 0);

  const handlePlaceOrder = async (formData: FormData) => {
    const shippingAddress = formData.get('address') as string;

    if (!shippingAddress) {
      toast.error('Por favor, ingresa una dirección de envío.');
      return;
    }

    startTransition(async () => {
      const result = await createOrder(items, subtotal, shippingAddress);

      if (result.error) {
        toast.error(result.error);
      } else if (result.success && result.orderId) {
        toast.success('¡Pedido realizado con éxito!');
        clearCart(); // Limpiamos el carrito local
        router.push(`/order-confirmation/${result.orderId}`); // Redirigimos a la página de confirmación
      }
    });
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-8">Finalizar Compra</h1>
      <form action={handlePlaceOrder} className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Información de Envío</h2>
          <div className="grid gap-2">
            <Label htmlFor="address">Dirección Completa</Label>
            <Input id="address" name="address" placeholder="Av. Principal 123, Lima" required />
          </div>
        </div>
        <div className="bg-muted p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Resumen de tu Pedido</h2>
          {/* Aquí iría un resumen más detallado si se desea */}
          <div className="flex justify-between font-bold text-lg mt-4 border-t pt-4">
            <span>Total</span>
            <span>S/ {subtotal.toFixed(2)}</span>
          </div>
          <Button type="submit" size="lg" className="w-full mt-6" disabled={isPending}>
            {isPending ? 'Procesando Pedido...' : 'Realizar Pedido'}
          </Button>
        </div>
      </form>
    </section>
  );
}
