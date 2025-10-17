// src/app/(admin)/admin/products/[id]/page.tsx
// Propósito: Página para editar un producto existente
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ProductForm } from '@/components/admin/products/product-form';
import { getProductById } from '@/actions/product';
import { notFound } from 'next/navigation';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const result = await getProductById(params.id);

  if (result.error || !result.product) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Editar Producto</CardTitle>
          <CardDescription>
            Modifica la información del producto #{result.product.id}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm product={result.product} />
        </CardContent>
      </Card>
    </div>
  );
}
