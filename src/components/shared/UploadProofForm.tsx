// src/components/shared/UploadProofForm.tsx
'use client';

import { useDropzone } from 'react-dropzone';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { uploadProof } from '@/actions/order';
import { toast } from 'sonner';

export default function UploadProofForm({ orderId }: { orderId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [isPending, startTransition] = useTransition();
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [], 'application/pdf': [] },
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles);
    },
    maxFiles: 1,
  });

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error('Por favor, selecciona un archivo.');
      return;
    }
    const formData = new FormData();
    formData.append('orderId', orderId);
    formData.append('file', files[0]);

    startTransition(async () => {
      const result = await uploadProof(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
        setFiles([]);
      }
    });
  };

  return (
    <div className="border-t mt-4 pt-4">
      <div
        {...getRootProps()}
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary"
      >
        <input {...getInputProps()} />
        {files.length > 0 ? (
          <p>{files[0].name}</p>
        ) : (
          <p>Arrastra tu comprobante aquí, o haz clic para seleccionarlo.</p>
        )}
      </div>
      <Button onClick={handleSubmit} disabled={isPending || files.length === 0} className="mt-4 w-full">
        {isPending ? 'Subiendo...' : 'Confirmar Subida'}
      </Button>
    </div>
  );
}
