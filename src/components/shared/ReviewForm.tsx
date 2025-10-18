// src/components/shared/ReviewForm.tsx
// Propósito: Formulario para dejar reseñas de productos
'use client';

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { submitReview, canUserReview } from '@/actions/review';
import StarRating from './StarRating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

type ReviewFormProps = {
  productId: number;
};

export default function ReviewForm({ productId }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [canReview, setCanReview] = useState<{ canReview: boolean; reason?: string } | null>(null);
  const [state, action, isPending] = useActionState(submitReview, null);

  useEffect(() => {
    // Verificar si el usuario puede dejar una reseña
    canUserReview(productId).then(setCanReview);
  }, [productId]);

  // Si la reseña fue exitosa, resetear el formulario
  useEffect(() => {
    if (state?.success) {
      setRating(0);
      // Revalidar permisos
      canUserReview(productId).then(setCanReview);
    }
  }, [state, productId]);

  if (!canReview) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!canReview.canReview) {
    return (
      <Alert>
        <AlertDescription>{canReview.reason}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Tu calificación <span className="text-destructive">*</span>
        </label>
        <StarRating
          rating={rating}
          onRatingChange={setRating}
          size="lg"
        />
        <input type="hidden" name="rating" value={rating} required />
        {rating === 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Haz clic en las estrellas para calificar
          </p>
        )}
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium mb-2">
          Tu reseña (opcional)
        </label>
        <Textarea
          id="comment"
          name="comment"
          placeholder="Comparte tu experiencia con este producto..."
          rows={4}
          maxLength={500}
          disabled={isPending}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Mínimo 10 caracteres, máximo 500
        </p>
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

      <Button
        type="submit"
        disabled={isPending || rating === 0}
        className="w-full sm:w-auto"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          'Publicar Reseña'
        )}
      </Button>
    </form>
  );
}
