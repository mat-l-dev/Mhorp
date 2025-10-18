// src/app/(store)/account/referrals/page.tsx
// Propósito: Página del dashboard de referidos del usuario

import { Metadata } from 'next';
import { ReferralDashboard } from '@/components/account/ReferralDashboard';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Mis Referidos - Mhorp',
  description: 'Programa de referidos - Invita amigos y gana recompensas',
};

export default async function ReferralsPage() {
  // Verificar autenticación
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/account/referrals');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Programa de Referidos</h1>
        <p className="text-muted-foreground mt-2">
          Invita a tus amigos y gana recompensas cuando hagan su primera compra
        </p>
      </div>

      <ReferralDashboard />
    </div>
  );
}
