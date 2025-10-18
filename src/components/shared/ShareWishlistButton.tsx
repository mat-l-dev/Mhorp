'use client';

import { useState, useTransition } from 'react';
import { createShareableWishlist, deleteSharedWishlist, toggleSharedWishlistVisibility } from '@/actions/shared-wishlist';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, Check, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SharedWishlist {
  id: number;
  name: string | null;
  token: string;
  viewCount: number;
  isPublic: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  shareUrl: string;
}

interface ShareWishlistButtonProps {
  existingShares: SharedWishlist[];
}

export function ShareWishlistButton({ existingShares }: ShareWishlistButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleShare = (formData: FormData) => {
    startTransition(async () => {
      const result = await createShareableWishlist(formData);

      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else {
        setShareUrl(result.shareUrl!);
        toast({
          title: '¡Link creado!',
          description: 'Tu wishlist ya se puede compartir',
        });
      }
    });
  };

  const handleCopy = async (url: string, token: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
      toast({
        title: '¡Copiado!',
        description: 'Link copiado al portapapeles',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo copiar el link',
      });
    }
  };

  const handleDelete = (token: string) => {
    if (!confirm('¿Estás seguro de eliminar este link compartido?')) return;

    startTransition(async () => {
      const result = await deleteSharedWishlist(token);
      
      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else {
        toast({
          title: 'Eliminado',
          description: result.success,
        });
      }
    });
  };

  const handleToggleVisibility = (token: string) => {
    startTransition(async () => {
      const result = await toggleSharedWishlistVisibility(token);
      
      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else {
        toast({
          title: 'Actualizado',
          description: result.success,
        });
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            Compartir Wishlist
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Compartir Mi Wishlist</DialogTitle>
            <DialogDescription>
              Crea un link para compartir tu lista de deseos con amigos y familia
            </DialogDescription>
          </DialogHeader>

          {!shareUrl ? (
            <form action={handleShare} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre de la lista</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ej: Cumpleaños de Juan"
                  defaultValue="Mi Lista de Deseos"
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Ej: Productos que me gustaría recibir para mi cumpleaños"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="expiresInDays">Expiración</Label>
                <Select name="expiresInDays" defaultValue="30">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 días</SelectItem>
                    <SelectItem value="15">15 días</SelectItem>
                    <SelectItem value="30">30 días</SelectItem>
                    <SelectItem value="60">60 días</SelectItem>
                    <SelectItem value="90">90 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Creando...' : 'Crear Link Compartible'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Tu link compartible:</p>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="text-sm" />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleCopy(shareUrl, 'new')}
                  >
                    {copiedToken === 'new' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  setOpen(false);
                  setShareUrl(null);
                }}
              >
                Crear Otro Link
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Existing Shares */}
      {existingShares.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Links Compartidos ({existingShares.length})
          </h3>
          {existingShares.map((share) => (
            <div
              key={share.token}
              className="p-4 border rounded-lg space-y-2 bg-card"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{share.name || 'Mi Lista de Deseos'}</p>
                    {!share.isPublic && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        Privada
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-x-3">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {share.viewCount} vistas
                    </span>
                    <span>
                      Creada {formatDistanceToNow(new Date(share.createdAt), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  {share.expiresAt && (
                    <p className="text-xs text-muted-foreground">
                      Expira {formatDistanceToNow(new Date(share.expiresAt), { addSuffix: true, locale: es })}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleToggleVisibility(share.token)}
                    disabled={isPending}
                    title={share.isPublic ? 'Hacer privada' : 'Hacer pública'}
                  >
                    {share.isPublic ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(share.token)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  value={share.shareUrl}
                  readOnly
                  className="text-xs"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleCopy(share.shareUrl, share.token)}
                  disabled={isPending}
                >
                  {copiedToken === share.token ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => window.open(share.shareUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
