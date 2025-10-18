// src/app/(store)/page.tsx
// Propósito: Página de inicio de la tienda con Hero Banner y productos destacados
import ProductCard from '@/components/shared/ProductCard';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Package, Shield, Zap } from 'lucide-react';

async function getLatestProducts() {
  return await db.query.products.findMany({
    orderBy: (products, { desc }) => [desc(products.createdAt)],
    limit: 8,
    with: {
      category: true,
    },
  });
}

async function getCategories() {
  return await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.name)],
    limit: 6,
  });
}

export default async function HomePage() {
  const products = await getLatestProducts();
  const categories = await getCategories();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Bienvenido a Mhorp
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Encuentra los mejores productos de tecnología y electrónica al mejor precio.
              Calidad garantizada y envío rápido a todo el Perú.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg">
                <Link href="#productos">
                  Explorar Productos
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg">
                <Link href="/search">
                  Buscar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Envío Rápido</h3>
              <p className="text-sm text-muted-foreground">
                Entrega en 24-48 horas en Lima Metropolitana
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Garantía de Calidad</h3>
              <p className="text-sm text-muted-foreground">
                Productos 100% originales con garantía del fabricante
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Proceso Fácil</h3>
              <p className="text-sm text-muted-foreground">
                Compra en 3 simples pasos y recibe confirmación al instante
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="bg-muted/30 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Explora por Categorías</h2>
              <p className="text-muted-foreground">
                Encuentra lo que buscas en nuestras categorías organizadas
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.id}`}
                  className="group relative overflow-hidden rounded-lg border bg-background p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="text-center">
                    <Package className="h-8 w-8 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products Section */}
      <section id="productos" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Productos Recientes</h2>
              <p className="text-muted-foreground">
                Descubre nuestras últimas incorporaciones al catálogo
              </p>
            </div>
          </div>
          
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Próximamente</h3>
              <p className="text-muted-foreground">
                Estamos preparando productos increíbles para ti
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para comprar?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Explora nuestro catálogo completo y encuentra exactamente lo que necesitas
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/search">
              Ver Todos los Productos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

