// src/components/admin/categories/category-form.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { upsertCategory } from '@/actions/category';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type Category = {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

interface CategoryFormProps {
  category?: Category;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando...' : 'Guardar Categoría'}
    </Button>
  );
}

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const [state, formAction] = useFormState(upsertCategory, null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      router.push('/admin/categories');
      router.refresh();
    }
    
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="grid gap-6">
      {category && <input type="hidden" name="id" value={category.id} />}
      
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre de la Categoría *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={category?.name}
          placeholder="Ej: Electrónica, Ropa, Hogar..."
          required
          maxLength={100}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={category?.description || ''}
          placeholder="Describe brevemente esta categoría (opcional)"
          rows={4}
          maxLength={500}
        />
      </div>

      <div className="flex gap-4">
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
