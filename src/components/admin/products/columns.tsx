// src/components/admin/products/columns.tsx
// Propósito: Definición de columnas para la tabla de productos
'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { DeleteProductButton } from './delete-product-button';
import Image from 'next/image';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  images: string[] | null;
  stock: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
  },
  {
    accessorKey: 'images',
    header: 'Imagen',
    cell: ({ row }) => {
      const images = row.original.images;
      const firstImage = images && images.length > 0 ? images[0] : null;
      
      return firstImage ? (
        <div className="relative h-12 w-12">
          <Image
            src={firstImage}
            alt={row.original.name}
            fill
            className="object-cover rounded"
          />
        </div>
      ) : (
        <div className="h-12 w-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
          Sin img
        </div>
      );
    },
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name}</p>
        {row.original.description && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {row.original.description}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'price',
    header: 'Precio',
    cell: ({ row }) => (
      <span className="font-semibold">S/ {parseFloat(row.original.price).toFixed(2)}</span>
    ),
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    cell: ({ row }) => {
      const stock = row.original.stock || 0;
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            stock > 10
              ? 'bg-green-100 text-green-800'
              : stock > 0
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {stock}
        </span>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Creado',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleDateString()}
      </span>
    ),
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      const product = row.original;

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
              <Link href={`/admin/products/${product.id}`} className="flex items-center cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <DeleteProductButton productId={product.id} productName={product.name} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
