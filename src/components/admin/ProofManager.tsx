// src/components/admin/ProofManager.tsx
// Propósito: Componente para que el admin apruebe o rechace comprobantes de pago
'use client';

import { Button } from '@/components/ui/button';
import { approveOrder, rejectOrder } from '@/actions/order';
import { useTransition, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Order = {
  id: number;
  userId: string;
  total: string;
  status: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string | null;
  shippingPhone: string;
  paymentProofUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PaymentProof = {
  id: number;
  orderId: number;
  userId: string;
  filePath: string;
  status: string;
  adminNotes: string | null;
  uploadedAt: Date;
};

type ProofManagerProps = {
  order: Order;
  proof: PaymentProof;
};

export default function ProofManager({ order, proof }: ProofManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = () => {
    if (!confirm('¿Estás seguro de aprobar este pedido?')) return;

    startTransition(async () => {
      const result = await approveOrder(order.id, proof.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
      }
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Por favor, ingresa un motivo de rechazo.');
      return;
    }

    if (!confirm('¿Estás seguro de rechazar este comprobante?')) return;

    startTransition(async () => {
      const result = await rejectOrder(order.id, proof.id, rejectReason);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
        setShowRejectForm(false);
        setRejectReason('');
      }
    });
  };

  // URL del comprobante en Supabase Storage
  const proofUrl = proof.filePath 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/payment_proofs/${proof.filePath}`
    : null;

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-muted/50">
        <h3 className="font-semibold mb-2">Comprobante de Pago</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Subido el: {new Date(proof.uploadedAt).toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Archivo: <code className="bg-background px-2 py-1 rounded">{proof.filePath}</code>
        </p>
        
        {proofUrl && (
          <div className="mb-4">
            <a 
              href={proofUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Ver comprobante →
            </a>
          </div>
        )}

        {!showRejectForm ? (
          <div className="flex gap-4">
            <Button 
              onClick={handleApprove} 
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              ✓ Aprobar Pedido
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setShowRejectForm(true)} 
              disabled={isPending}
            >
              ✗ Rechazar
            </Button>
          </div>
        ) : (
          <div className="space-y-4 border-t pt-4">
            <div>
              <Label htmlFor="reject-reason">Motivo del Rechazo</Label>
              <Input
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ej: Comprobante ilegible, datos no coinciden..."
                disabled={isPending}
              />
            </div>
            <div className="flex gap-4">
              <Button 
                variant="destructive" 
                onClick={handleReject} 
                disabled={isPending || !rejectReason.trim()}
              >
                {isPending ? 'Rechazando...' : 'Confirmar Rechazo'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason('');
                }} 
                disabled={isPending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
