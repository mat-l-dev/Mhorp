// src/components/admin/products/delete-product-button.tsx
// Propósito: Botón para eliminar productos con confirmación
'use client';

import { deleteProduct } from '@/actions/product';
import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: number;
  productName: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`¿Estás seguro de eliminar "${productName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="flex items-center w-full cursor-pointer text-destructive"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {isPending ? 'Eliminando...' : 'Eliminar'}
    </button>
  );
}
