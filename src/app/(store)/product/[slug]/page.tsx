// src/app/(store)/product/[slug]/page.tsx
// Propósito: Página de detalle de producto individual (Product Detail Page - PDP).

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Detalle del Producto</h1>
      <p className="text-muted-foreground">Slug: {slug}</p>
      {/* TODO: Implementar la visualización del producto */}
    </div>
  );
}
