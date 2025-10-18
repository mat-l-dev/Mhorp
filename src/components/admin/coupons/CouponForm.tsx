// src/components/admin/coupons/CouponForm.tsx
// Propósito: Formulario para crear/editar cupones
'use client';

import { useActionState } from 'react';
import { upsertCoupon } from '@/actions/coupon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { coupons } from '@/lib/db/schema';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type CouponFormProps = {
  coupon?: typeof coupons.$inferSelect;
};

export default function CouponForm({ coupon }: CouponFormProps) {
  const [state, action, isPending] = useActionState(upsertCoupon, null);

  return (
    <form action={action} className="space-y-6">
      {coupon && <input type="hidden" name="id" value={coupon.id} />}

      <div>
        <Label htmlFor="code">Código del Cupón *</Label>
        <Input
          id="code"
          name="code"
          required
          defaultValue={coupon?.code}
          placeholder="VERANO2024"
          pattern="[A-Z0-9_-]+"
          className="font-mono uppercase"
          disabled={isPending}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Solo letras mayúsculas, números, guiones y guiones bajos
        </p>
      </div>

      <div>
        <Label htmlFor="discountType">Tipo de Descuento *</Label>
        <Select name="discountType" defaultValue={coupon?.discountType || 'percentage'} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">Porcentaje (%)</SelectItem>
            <SelectItem value="fixed">Monto Fijo (S/)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="discountValue">Valor del Descuento *</Label>
        <Input
          id="discountValue"
          name="discountValue"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={coupon?.discountValue}
          placeholder="10"
          disabled={isPending}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Ingresa el porcentaje (ej: 10 para 10%) o monto fijo (ej: 50 para S/ 50)
        </p>
      </div>

      <div>
        <Label htmlFor="expiresAt">Fecha de Expiración (opcional)</Label>
        <Input
          id="expiresAt"
          name="expiresAt"
          type="datetime-local"
          defaultValue={coupon?.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : ''}
          disabled={isPending}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Déjalo vacío para que no expire
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          value="true"
          defaultChecked={coupon?.isActive ?? true}
          className="h-4 w-4"
          disabled={isPending}
        />
        <Label htmlFor="isActive" className="cursor-pointer">
          Cupón activo
        </Label>
      </div>

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state?.success && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            coupon ? 'Actualizar Cupón' : 'Crear Cupón'
          )}
        </Button>
      </div>
    </form>
  );
}
