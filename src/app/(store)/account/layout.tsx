// src/app/(store)/account/layout.tsx
import Link from 'next/link';
import { ReactNode } from 'react';

const sidebarNavItems = [
  { title: 'Mis Pedidos', href: '/account/orders' },
  { title: 'Mi Perfil', href: '/account/profile' }, // Placeholder para el futuro
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto grid flex-1 gap-12 md:grid-cols-[200px_1fr] py-12">
      <aside className="hidden w-[200px] flex-col md:flex">
        <nav className="grid gap-2">
          {sidebarNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-primary"
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>
      <main>{children}</main>
    </div>
  );
}
