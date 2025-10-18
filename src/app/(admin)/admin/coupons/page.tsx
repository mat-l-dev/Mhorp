// src/app/(admin)/admin/coupons/page.tsx
// Propósito: Gestión de cupones de descuento (Admin)
import { getAllCoupons } from '@/actions/coupon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, Calendar, Tag, Percent, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const metadata = {
  title: 'Gestión de Cupones - Admin',
  description: 'Administrar cupones de descuento',
};

export default async function CouponsAdminPage() {
  const coupons = await getAllCoupons();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Cupones de Descuento</h1>
          <p className="text-muted-foreground">
            {coupons.length} cupones totales
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/coupons/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cupón
          </Link>
        </Button>
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-lg">
          <Tag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No hay cupones creados</h2>
          <p className="text-muted-foreground mb-6">
            Crea tu primer cupón de descuento
          </p>
          <Button asChild>
            <Link href="/admin/coupons/new">Crear Cupón</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {coupons.map((coupon) => {
            const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
            
            return (
              <div
                key={coupon.id}
                className="border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold font-mono">{coupon.code}</h3>
                      <Badge
                        variant={coupon.isActive && !isExpired ? 'default' : 'secondary'}
                      >
                        {isExpired ? 'Expirado' : coupon.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {coupon.discountType === 'percentage' ? (
                          <>
                            <Percent className="h-4 w-4" />
                            <span>{coupon.discountValue}% de descuento</span>
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4" />
                            <span>S/ {parseFloat(coupon.discountValue).toFixed(2)} de descuento</span>
                          </>
                        )}
                      </div>
                      
                      {coupon.expiresAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {isExpired 
                              ? 'Expiró ' + formatDistanceToNow(new Date(coupon.expiresAt), { addSuffix: true, locale: es })
                              : 'Expira ' + formatDistanceToNow(new Date(coupon.expiresAt), { addSuffix: true, locale: es })
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/coupons/${coupon.id}`}>Editar</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
