// src/app/(admin)/admin/categories/[id]/page.tsx
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CategoryForm } from '@/components/admin/categories/category-form';
import { getCategoryById } from '@/actions/category';

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await getCategoryById(id);

  if (!category) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Editar Categoría</CardTitle>
          <CardDescription>
            Modifica la información de la categoría
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm category={category} />
        </CardContent>
      </Card>
    </div>
  );
}
