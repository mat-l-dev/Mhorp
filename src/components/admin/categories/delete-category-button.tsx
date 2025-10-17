// src/components/admin/categories/delete-category-button.tsx
'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteCategory } from '@/actions/category';
import { toast } from 'sonner';

interface DeleteCategoryButtonProps {
  categoryId: number;
  categoryName: string;
}

export function DeleteCategoryButton({ categoryId, categoryName }: DeleteCategoryButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm(`¿Estás seguro de eliminar la categoría "${categoryName}"? Esta acción no se puede deshacer.`)) {
      startTransition(async () => {
        const result = await deleteCategory(categoryId);
        
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(result.success);
        }
      });
    }
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
