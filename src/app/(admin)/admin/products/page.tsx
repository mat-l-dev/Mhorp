// src/app/(admin)/admin/products/page.tsx
// Propósito: Página de gestión de productos para el administrador
import { db } from '@/lib/db';
import { ProductTable } from '@/components/admin/products/product-table';
import { columns } from '@/components/admin/products/columns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

async function getProducts() {
  return await db.query.products.findMany({
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });
}

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Productos</h1>
          <p className="text-muted-foreground mt-2">
            {products.length} {products.length === 1 ? 'producto' : 'productos'} en catálogo
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">+ Crear Producto</Link>
        </Button>
      </div>
      <ProductTable columns={columns} data={products} />
    </div>
  );
}
