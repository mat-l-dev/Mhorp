// src/app/(auth)/signup/page.tsx
// Propósito: Página de registro (signup) para nuevos usuarios con soporte para referidos.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { processReferralSignup, validateReferralCode } from '@/actions/referral';
import { useReferralTracking, getReferralCode, clearReferralCode } from '@/hooks/use-referral-tracking';
import { Gift, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const { referralCode: urlReferralCode, hasReferralCode } = useReferralTracking();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referralMessage, setReferralMessage] = useState('');

  // Auto-llenar código de referido si viene de URL
  useEffect(() => {
    if (urlReferralCode) {
      setReferralCode(urlReferralCode);
      validateCode(urlReferralCode);
    }
  }, [urlReferralCode]);

  async function validateCode(code: string) {
    if (!code || code.length < 6) {
      setReferralValid(null);
      setReferralMessage('');
      return;
    }

    const result = await validateReferralCode(code);
    setReferralValid(result.valid);
    setReferralMessage(result.message || '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validaciones
      if (!name.trim()) {
        throw new Error('Por favor ingresa tu nombre');
      }
      if (!email.trim()) {
        throw new Error('Por favor ingresa tu email');
      }
      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Crear cuenta en Supabase Auth
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Error al crear la cuenta');

      // Crear usuario en la base de datos
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          name,
        });

      if (dbError && !dbError.message.includes('duplicate')) {
        console.error('Error al crear usuario en DB:', dbError);
      }

      // Procesar código de referido si existe
      const savedCode = getReferralCode() || referralCode;
      if (savedCode) {
        const referralResult = await processReferralSignup(savedCode, authData.user.id);
        
        if (referralResult.success && referralResult.couponCode) {
          toast.success(
            `¡Bienvenido! 🎉 Usa el cupón ${referralResult.couponCode} para ${referralResult.discount}% de descuento`
          );
          clearReferralCode(); // Limpiar código guardado
        }
      }

      toast.success('¡Cuenta creada exitosamente!');
      router.push('/');
    } catch (err) {
      console.error('Error en signup:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la cuenta';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl text-center">Crear Cuenta</CardTitle>
          <CardDescription className="text-center">
            Únete a Mhorp y empieza a comprar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error general */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Banner de referido */}
            {hasReferralCode && referralValid && (
              <Alert className="bg-green-50 border-green-200">
                <Gift className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {referralMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
            </div>

            {/* Código de referido */}
            <div className="space-y-2">
              <Label htmlFor="referralCode">
                Código de Referido <span className="text-muted-foreground">(Opcional)</span>
              </Label>
              <div className="relative">
                <Input
                  id="referralCode"
                  type="text"
                  value={referralCode}
                  onChange={(e) => {
                    const code = e.target.value.toUpperCase();
                    setReferralCode(code);
                    validateCode(code);
                  }}
                  placeholder="ABCD1234"
                  className={
                    referralCode.length >= 6
                      ? referralValid
                        ? 'border-green-500'
                        : 'border-red-500'
                      : ''
                  }
                />
                {referralCode.length >= 6 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {referralValid ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                )}
              </div>
              {referralMessage && (
                <p className={`text-xs ${referralValid ? 'text-green-600' : 'text-red-600'}`}>
                  {referralMessage}
                </p>
              )}
            </div>

            {/* Botón de submit */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
          </form>

          {/* Link a login */}
          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Inicia sesión
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
