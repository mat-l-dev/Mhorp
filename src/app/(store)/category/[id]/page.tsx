// src/app/(store)/category/[id]/page.tsx
// Propósito: Página dinámica para mostrar productos por categoría
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/shared/ProductCard';
import { Tag } from 'lucide-react';

async function getCategoryAndProducts(categoryId: string) {
  return await db.query.categories.findFirst({
    where: eq(categories.id, parseInt(categoryId)),
    with: { 
      products: {
        orderBy: (products, { desc }) => [desc(products.createdAt)],
      },
    },
  });
}

interface CategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params;
  const categoryData = await getCategoryAndProducts(id);

  if (!categoryData) {
    notFound();
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Tag className="h-5 w-5" />
          <span className="text-sm">Categoría</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{categoryData.name}</h1>
        {categoryData.description && (
          <p className="text-lg text-muted-foreground max-w-2xl">
            {categoryData.description}
          </p>
        )}
        <p className="text-sm text-muted-foreground mt-4">
          {categoryData.products.length} {categoryData.products.length === 1 ? 'producto' : 'productos'}
        </p>
      </div>

      {categoryData.products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categoryData.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Tag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No hay productos en esta categoría</h2>
          <p className="text-muted-foreground">
            Pronto agregaremos productos a esta categoría
          </p>
        </div>
      )}
    </section>
  );
}

// Metadata dinámica para SEO
export async function generateMetadata({ params }: CategoryPageProps) {
  const { id } = await params;
  const categoryData = await getCategoryAndProducts(id);
  
  if (!categoryData) {
    return {
      title: 'Categoría no encontrada | Mhorp',
    };
  }
  
  return {
    title: `${categoryData.name} | Mhorp`,
    description: categoryData.description || `Explora nuestros productos en la categoría ${categoryData.name}`,
  };
}
