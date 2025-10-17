// src/app/(auth)/login/page.tsx
// Propósito: Página de login que ahora muestra mensajes de feedback.
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login, signup } from '@/actions/auth';

export default async function LoginPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ message?: string }> 
}) {
  const params = await searchParams;
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Acceso</CardTitle>
          <CardDescription>
            Ingresa tus datos para acceder o registrarte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@ejemplo.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {params.message && (
              <p className="text-sm p-2 bg-foreground/10 text-foreground text-center rounded-md">
                {params.message}
              </p>
            )}
            <Button formAction={login} className="w-full">
              Iniciar Sesión
            </Button>
            <Button formAction={signup} variant="outline" className="w-full">
              Registrarse
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
