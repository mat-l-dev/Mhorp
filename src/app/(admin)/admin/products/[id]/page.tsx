// src/app/(admin)/admin/products/[id]/page.tsx
// Propósito: Página para editar un producto existente
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ProductForm } from '@/components/admin/products/product-form';
import { getProductById } from '@/actions/product';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';

async function getCategories() {
  return await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.name)],
  });
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getProductById(id);
  const categories = await getCategories();

  if (result.error || !result.product) {
    notFound();
  }

  return (
    <div className="max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Editar Producto</CardTitle>
          <CardDescription>
            Modifica la información del producto #{result.product.id}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm product={result.product} categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
