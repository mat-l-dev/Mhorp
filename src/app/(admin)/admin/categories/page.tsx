// src/app/(admin)/admin/categories/page.tsx
// Propósito: Página de gestión de categorías para el administrador
import { db } from '@/lib/db';
import { CategoryTable } from '@/components/admin/categories/category-table';
import { columns } from '@/components/admin/categories/columns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

async function getCategories() {
  return await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.name)],
  });
}

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Categorías</h1>
          <p className="text-muted-foreground mt-2">
            {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'} registradas
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/new">+ Crear Categoría</Link>
        </Button>
      </div>
      <CategoryTable columns={columns} data={categories} />
    </div>
  );
}
