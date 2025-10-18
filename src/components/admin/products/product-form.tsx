// src/components/admin/products/product-form.tsx
// Propósito: Formulario para crear y editar productos
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { upsertProduct, uploadProductImages } from '@/actions/product';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import type { ProductWithRelations } from '@mhorp/services';

type Category = {
  id: number;
  name: string;
};

function SubmitButton({ isUploading }: { isUploading: boolean }) {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" disabled={pending || isUploading} className="w-full sm:w-auto">
      {isUploading ? 'Subiendo imágenes...' : pending ? 'Guardando...' : 'Guardar Producto'}
    </Button>
  );
}

interface ProductFormProps {
  product?: ProductWithRelations;
  categories?: Category[];
}

export function ProductForm({ product, categories = [] }: ProductFormProps) {
  const [state, formAction] = useFormState(upsertProduct, null);
  const router = useRouter();
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images || []);
  const [isUploading, setIsUploading] = useState(false);

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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    
    acceptedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const result = await uploadProductImages(formData);
      
      if (result.error) {
        toast.error(result.error);
      } else if (result.urls) {
        setImageUrls((prev) => [...prev, ...result.urls]);
        toast.success(`${result.urls.length} imagen(es) subida(s) exitosamente`);
      }
    } catch (error) {
      toast.error('Error al subir las imágenes');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true
  });

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form action={formAction} className="grid gap-6">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="images" value={JSON.stringify(imageUrls)} />
      
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

      {categories.length > 0 && (
        <div className="grid gap-2">
          <Label htmlFor="categoryId">Categoría</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={product?.categoryId || ''}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-muted-foreground">
            Opcional. Organiza tu producto por categoría
          </p>
        </div>
      )}

      <div className="grid gap-4">
        <Label>Imágenes del Producto</Label>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            {isDragActive ? (
              <p>Suelta las imágenes aquí...</p>
            ) : (
              <>
                <p>Arrastra y suelta imágenes aquí, o haz clic para seleccionar</p>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG, JPEG o WEBP (máx. 5MB cada una)
                </p>
              </>
            )}
          </div>
        </div>

        {imageUrls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative group aspect-square">
                <Image
                  src={url}
                  alt={`Producto ${index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {imageUrls.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-2" />
            <p className="text-sm">No hay imágenes agregadas</p>
          </div>
        )}
      </div>

      <div className="border-t pt-6 flex gap-4">
        <SubmitButton isUploading={isUploading} />
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
