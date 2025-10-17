// src/components/shared/Footer.tsx
// Propósito: Componente de pie de página compartido en toda la aplicación.

export default function Footer() {
  return (
    <footer className="w-full border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Mhorp</h3>
            <p className="text-sm text-muted-foreground">
              Tu tienda de confianza para productos de calidad.
            </p>
          </div>
          {/* TODO: Agregar más secciones del footer */}
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Mhorp. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
