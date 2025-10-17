// src/app/(admin)/admin/products/new/page.tsx
// Propósito: Página para crear un nuevo producto
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ProductForm } from '@/components/admin/products/product-form';
import { db } from '@/lib/db';

async function getCategories() {
  return await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.name)],
  });
}

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Producto</CardTitle>
          <CardDescription>
            Agrega un nuevo producto al catálogo de la tienda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
