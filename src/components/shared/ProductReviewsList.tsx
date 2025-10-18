// src/components/shared/ProductReviewsList.tsx
// Propósito: Mostrar lista de reseñas de un producto
import { getProductReviews } from '@/actions/review';
import StarRating from './StarRating';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare, CheckCircle } from 'lucide-react';

type ProductReviewsListProps = {
  productId: number;
};

export default async function ProductReviewsList({ productId }: ProductReviewsListProps) {
  const reviews = await getProductReviews(productId);

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Aún no hay reseñas para este producto.</p>
        <p className="text-sm mt-1">¡Sé el primero en dejar una reseña!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b pb-6 last:border-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-medium">{review.user.name || 'Usuario'}</span>
                <StarRating rating={review.rating} readonly size="sm" />
                {review.isVerified && (
                  <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    <CheckCircle className="h-3 w-3" />
                    <span className="font-medium">Compra Verificada</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(review.createdAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </p>
            </div>
          </div>
          {review.comment && (
            <p className="text-sm mt-2 leading-relaxed">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}
