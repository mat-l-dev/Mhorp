// src/app/(admin)/layout.tsx
// Propósito: Layout protegido para el panel de administración con validación de roles
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function getUserRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Obtener el rol del usuario desde la base de datos
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  // Fallback: Si el email coincide con ADMIN_EMAIL, es admin
  if (process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL) {
    return 'admin';
  }

  return dbUser?.role || 'customer';
}

const adminNavItems = [
  { title: 'Dashboard', href: '/admin/dashboard' },
  { title: 'Pedidos', href: '/admin/orders' },
  { title: 'Productos', href: '/admin/products' },
  { title: 'Categorías', href: '/admin/categories' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await getUserRole();

  if (role !== 'admin') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Panel de Administración - Mhorp</h1>
        </div>
      </div>
      <div className="container mx-auto grid flex-1 gap-12 md:grid-cols-[200px_1fr] py-12 px-4">
        <aside className="hidden w-[200px] flex-col md:flex">
          <nav className="grid gap-2">
            <span className="font-semibold text-lg mb-2">Menú Admin</span>
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-primary hover:bg-muted"
              >
                {item.title}
              </Link>
            ))}
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-primary hover:bg-muted mt-4"
            >
              ← Volver a la Tienda
            </Link>
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
