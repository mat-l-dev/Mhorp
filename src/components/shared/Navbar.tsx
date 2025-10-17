// src/components/shared/Navbar.tsx
// Propósito: Barra de navegación dinámica que reacciona al estado de autenticación.
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import CartIcon from './CartIcon';
import { Button } from '@/components/ui/button';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="w-full border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold">
              Mhorp
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <CartIcon />
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user.email}
                </span>
                <LogoutButton />
              </>
            ) : (
              <Button asChild>
                <Link href="/login">Acceder</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
