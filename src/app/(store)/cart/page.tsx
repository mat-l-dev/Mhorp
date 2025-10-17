// src/app/(store)/cart/page.tsx
'use client';

import { useCartStore } from '@/lib/store/cart';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CartPage() {
  const { items, removeItem } = useCartStore();

  const subtotal = items.reduce((acc, item) => {
    const price = parseFloat(item.product.price || '0');
    return acc + price * item.quantity;
  }, 0);

  if (items.length === 0) {
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Tu Carrito está Vacío</h1>
        <Button asChild>
          <Link href="/">Seguir Comprando</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-8">Tu Carrito</h1>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.product.id} className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20">
                <Image
                  src={item.product.images?.[0] || '/placeholders/placeholder.png'}
                  alt={item.product.name}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <div>
                <h2 className="font-semibold">{item.product.name}</h2>
                <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-semibold">S/ {(parseFloat(item.product.price || '0') * item.quantity).toFixed(2)}</p>
              <Button variant="outline" size="sm" onClick={() => removeItem(item.product.id)}>
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-end">
        <div className="w-full max-w-sm">
          <div className="flex justify-between font-bold text-lg">
            <span>Subtotal</span>
            <span>S/ {subtotal.toFixed(2)}</span>
          </div>
          <Button asChild size="lg" className="w-full mt-4">
            <Link href="/checkout">Proceder al Pago</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
