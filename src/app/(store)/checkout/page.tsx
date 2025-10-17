// src/app/(store)/checkout/page.tsx
// Propósito: Página de checkout/finalización de compra.

export default function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Finalizar Compra</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* TODO: Implementar formulario de checkout */}
          <p className="text-muted-foreground">Formulario de checkout</p>
        </div>
        <div className="lg:col-span-1">
          {/* TODO: Implementar resumen final del pedido */}
        </div>
      </div>
    </div>
  );
}
