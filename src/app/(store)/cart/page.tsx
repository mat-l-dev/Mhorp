// src/app/(store)/cart/page.tsx
// Propósito: Página del carrito de compras donde se muestran los productos agregados.

export default function CartPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Carrito de Compras</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <p className="text-muted-foreground">Tu carrito está vacío</p>
          {/* TODO: Implementar lista de productos en el carrito */}
        </div>
        <div className="lg:col-span-1">
          {/* TODO: Implementar resumen del pedido */}
        </div>
      </div>
    </div>
  );
}
