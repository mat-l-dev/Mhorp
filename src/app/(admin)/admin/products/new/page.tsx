// src/app/(admin)/admin/products/new/page.tsx
// Propósito: Página para crear un nuevo producto
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ProductForm } from '@/components/admin/products/product-form';

export default function NewProductPage() {
  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Producto</CardTitle>
          <CardDescription>
            Agrega un nuevo producto al catálogo de la tienda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm />
        </CardContent>
      </Card>
    </div>
  );
}
