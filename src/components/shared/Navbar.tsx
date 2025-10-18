// src/components/shared/Navbar.tsx
// Propósito: Barra de navegación dinámica que reacciona al estado de autenticación.
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import CartIcon from './CartIcon';
import Searchbar from './Searchbar';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

async function isUserAdmin(userId: string) {
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  return dbUser?.role === 'admin';
}

async function getCategories() {
  return await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.name)],
    limit: 10,
  });
}

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user ? await isUserAdmin(user.id) : false;
  const categories = await getCategories();

  return (
    <nav className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
              Mhorp
            </Link>
            
            {categories.length > 0 && (
              <NavigationMenu className="hidden lg:flex">
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Categorías</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                        {categories.map((category) => (
                          <li key={category.id}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={`/category/${category.id}`}
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              >
                                <div className="text-sm font-medium leading-none">{category.name}</div>
                                {category.description && (
                                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    {category.description}
                                  </p>
                                )}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>
          
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <Searchbar />
          </div>
          
          <div className="flex items-center space-x-4">
            <CartIcon />
            {user ? (
              <>
                {isAdmin && (
                  <Button variant="outline" asChild size="sm">
                    <Link href="/admin/dashboard">Admin Panel</Link>
                  </Button>
                )}
                <Button variant="ghost" asChild>
                  <Link href="/account/orders">Mi Cuenta</Link>
                </Button>
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
