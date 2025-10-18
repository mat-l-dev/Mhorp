// src/app/(admin)/admin/coupons/new/page.tsx
// Propósito: Crear nuevo cupón
import CouponForm from '@/components/admin/coupons/CouponForm';

export const metadata = {
  title: 'Nuevo Cupón - Admin',
};

export default function NewCouponPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Crear Nuevo Cupón</h1>
      <CouponForm />
    </div>
  );
}
