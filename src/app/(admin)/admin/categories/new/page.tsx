// src/app/(admin)/admin/categories/new/page.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CategoryForm } from '@/components/admin/categories/category-form';

export default function NewCategoryPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Crear Nueva Categoría</CardTitle>
          <CardDescription>
            Organiza tus productos en categorías para facilitar la navegación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm />
        </CardContent>
      </Card>
    </div>
  );
}
