// src/components/admin/products/product-form.tsx
// Propósito: Formulario para crear y editar productos
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { upsertProduct } from '@/actions/product';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  stock: number | null;
  images: string[] | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? 'Guardando...' : 'Guardar Producto'}
    </Button>
  );
}

export function ProductForm({ product }: { product?: Product }) {
  const [state, formAction] = useFormState(upsertProduct, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      router.push('/admin/products');
      router.refresh();
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="grid gap-6">
      {product && <input type="hidden" name="id" value={product.id} />}
      
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre del Producto *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={product?.name}
          placeholder="Ej: Starlink Kit Standard"
          required
          maxLength={100}
        />
        <p className="text-sm text-muted-foreground">
          Nombre completo y descriptivo del producto
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={product?.description || ''}
          placeholder="Describe las características y beneficios del producto..."
          rows={4}
          maxLength={500}
        />
        <p className="text-sm text-muted-foreground">
          Opcional. Máximo 500 caracteres
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="grid gap-2">
          <Label htmlFor="price">Precio (S/) *</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.price}
            placeholder="0.00"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="stock">Stock Disponible *</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            step="1"
            min="0"
            defaultValue={product?.stock || 0}
            placeholder="0"
            required
          />
        </div>
      </div>

      <div className="border-t pt-6 flex gap-4">
        <SubmitButton />
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
