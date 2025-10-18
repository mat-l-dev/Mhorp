'use client';

// src/components/account/ReferralDashboard.tsx
// Propósito: Dashboard de referidos para el usuario

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getUserReferralStats, getUserReferrals, type ReferralDetails, type UserReferralStats } from '@/actions/referral';
import { Users, Gift, TrendingUp, Copy, Check, ExternalLink, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function ReferralDashboard() {
  const [stats, setStats] = useState<UserReferralStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [statsData, referralsData] = await Promise.all([
        getUserReferralStats(),
        getUserReferrals(),
      ]);
      
      setStats(statsData);
      setReferrals(referralsData);
    } catch (error) {
      console.error('Error al cargar datos de referidos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  function copyReferralLink() {
    if (!stats) return;
    
    navigator.clipboard.writeText(stats.referralLink);
    setCopied(true);
    toast.success('¡Link copiado al portapapeles!');
    
    setTimeout(() => setCopied(false), 2000);
  }

  function shareOnWhatsApp() {
    if (!stats) return;
    
    const message = encodeURIComponent(
      `¡Únete a Mhorp y obtén 10% de descuento en tu primera compra! 🎁\n\nUsa mi código de referido: ${stats.referralCode}\n\nO regístrate aquí: ${stats.referralLink}`
    );
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }

  function shareOnFacebook() {
    if (!stats) return;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(stats.referralLink)}`, '_blank');
  }

  function shareOnTwitter() {
    if (!stats) return;
    const text = encodeURIComponent(`¡Únete a Mhorp con mi código ${stats.referralCode} y obtén 10% de descuento! 🎁`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(stats.referralLink)}`, '_blank');
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-muted rounded-lg" />
        <div className="h-40 bg-muted rounded-lg" />
        <div className="h-80 bg-muted rounded-lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Error al cargar los datos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con código de referido */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Tu Código de Referido
          </CardTitle>
          <CardDescription>
            Comparte tu código y gana recompensas cuando tus amigos hagan su primera compra
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Código */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-background rounded-lg border-2 border-primary/30 p-4">
              <p className="text-sm text-muted-foreground mb-1">Tu código único</p>
              <p className="text-2xl font-bold tracking-wider">{stats.referralCode}</p>
            </div>
          </div>

          {/* Link para compartir */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Link de referido</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={stats.referralLink}
                readOnly
                className="flex-1 px-3 py-2 text-sm rounded-md border bg-background"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyReferralLink}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Botones de compartir */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={shareOnWhatsApp}>
              <ExternalLink className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={shareOnFacebook}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Facebook
            </Button>
            <Button variant="outline" size="sm" onClick={shareOnTwitter}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Twitter
            </Button>
          </div>

          {/* Beneficios */}
          <div className="bg-background/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">🎁 Beneficios del programa:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✅ Tus amigos obtienen <strong>10% de descuento</strong> en su primera compra</li>
              <li>✅ Tú ganas <strong>200 puntos</strong> cuando completen su primera compra</li>
              <li>✅ Sin límite de referidos - ¡comparte sin parar!</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              Personas que usaron tu código
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedReferrals}</div>
            <p className="text-xs text-muted-foreground">
              Compraron por primera vez
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntos Ganados</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalPointsEarned}</div>
            <p className="text-xs text-muted-foreground">
              Por referidos exitosos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              De registro a compra
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de referidos */}
      <Card>
        <CardHeader>
          <CardTitle>Tus Referidos</CardTitle>
          <CardDescription>
            {referrals.length === 0
              ? 'Aún no has referido a nadie. ¡Comparte tu código y empieza a ganar!'
              : `Has referido a ${referrals.length} ${referrals.length === 1 ? 'persona' : 'personas'}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No tienes referidos todavía</p>
              <p className="text-sm mt-2">Comparte tu código con amigos y familiares</p>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {referral.referredUserEmail || 'Usuario anónimo'}
                      </p>
                      <ReferralStatusBadge status={referral.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Registrado {formatDistanceToNow(new Date(referral.createdAt), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                      {referral.firstOrderAmount && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Primera compra: S/ {referral.firstOrderAmount}
                        </span>
                      )}
                    </div>
                  </div>
                  {referral.status === 'rewarded' && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Gift className="h-3 w-3 mr-1" />
                      200 pts
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReferralStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Pendiente', variant: 'secondary' },
    completed: { label: 'Compró', variant: 'default' },
    rewarded: { label: 'Recompensado', variant: 'outline' },
  };

  const config = variants[status] || variants.pending;

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
