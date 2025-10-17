// src/app/(store)/page.tsx
// Propósito: Página de inicio de la tienda, ahora muestra productos.
import ProductCard from '@/components/shared/ProductCard';
import { db } from '@/lib/db';

async function getProducts() {
  const products = await db.query.products.findMany({
    orderBy: (products, { desc }) => [desc(products.createdAt)],
    limit: 6,
  });
  return products;
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-8">Nuestros Productos</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

