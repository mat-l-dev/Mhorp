// src/app/(admin)/admin/coupons/[id]/page.tsx
// Propósito: Editar cupón existente
import { getCouponById } from '@/actions/coupon';
import CouponForm from '@/components/admin/coupons/CouponForm';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Editar Cupón - Admin',
};

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coupon = await getCouponById(Number(id));

  if (!coupon) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Editar Cupón</h1>
      <CouponForm coupon={coupon} />
    </div>
  );
}
