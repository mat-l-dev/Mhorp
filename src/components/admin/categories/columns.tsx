// src/components/admin/categories/columns.tsx
'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteCategoryButton } from './delete-category-button';

type Category = {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('id')}</span>,
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.getValue('name')}</p>
        {row.original.description && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {row.original.description}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Creado',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'));
      return <span className="text-sm">{date.toLocaleDateString('es-PE')}</span>;
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      const category = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/admin/categories/${category.id}`}
                className="flex items-center cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <DeleteCategoryButton categoryId={category.id} categoryName={category.name} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
