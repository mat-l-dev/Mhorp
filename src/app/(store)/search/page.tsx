// src/app/(store)/search/page.tsx
// Propósito: Página de resultados de búsqueda de productos
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { ilike } from 'drizzle-orm';
import ProductCard from '@/components/shared/ProductCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

async function searchProducts(query: string) {
  return await db.query.products.findMany({
    where: ilike(products.name, `%${query}%`),
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });
}

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params?.q as string | undefined;

  if (!query || query.trim() === '') {
    return (
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Buscar Productos</h1>
          <p className="text-muted-foreground mb-6">
            Utiliza la barra de búsqueda en la parte superior para encontrar productos
          </p>
          <Button asChild>
            <Link href="/">Explorar Catálogo</Link>
          </Button>
        </div>
      </section>
    );
  }

  const results = await searchProducts(query);

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Resultados de búsqueda</h1>
        <p className="text-muted-foreground">
          {results.length} {results.length === 1 ? 'producto encontrado' : 'productos encontrados'} para "{query}"
        </p>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No se encontraron productos</h2>
          <p className="text-muted-foreground mb-6">
            No hay productos que coincidan con "{query}"
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/">Ver Catálogo</Link>
            </Button>
            <Button asChild>
              <Link href="/search">Nueva Búsqueda</Link>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

// Metadata dinámica para SEO
export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params?.q as string | undefined;
  
  return {
    title: query ? `Búsqueda: ${query} | Mhorp` : 'Buscar Productos | Mhorp',
    description: query 
      ? `Resultados de búsqueda para "${query}" en Mhorp` 
      : 'Encuentra los productos que buscas en Mhorp',
  };
}
