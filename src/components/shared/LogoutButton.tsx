// src/components/shared/LogoutButton.tsx
import { logout } from '@/actions/auth';
import { Button } from '@/components/ui/button';

export default function LogoutButton() {
  return (
    <form action={logout}>
      <Button variant="ghost">Cerrar Sesión</Button>
    </form>
  );
}
