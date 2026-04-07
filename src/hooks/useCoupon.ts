import { useState, useCallback } from "react";

interface Coupon {
  code: string;
  discount: number; // percentage or fixed
  type: "percent" | "fixed";
  minOrder: number;
  maxDiscount?: number;
  description: string;
}

const availableCoupons: Coupon[] = [
  { code: "NOVAX100K", discount: 100000, type: "fixed", minOrder: 2000000, description: "Giảm 100.000đ cho đơn từ 2 triệu" },
  { code: "NOVAX10", discount: 10, type: "percent", minOrder: 5000000, maxDiscount: 500000, description: "Giảm 10% tối đa 500K cho đơn từ 5 triệu" },
  { code: "FREESHIP", discount: 50000, type: "fixed", minOrder: 0, description: "Miễn phí vận chuyển" },
  { code: "NEWUSER", discount: 200000, type: "fixed", minOrder: 1000000, description: "Giảm 200.000đ cho khách hàng mới" },
];

export function useCoupon() {
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyCoupon = useCallback((code: string, orderTotal: number) => {
    setError(null);
    const coupon = availableCoupons.find(c => c.code.toUpperCase() === code.toUpperCase());

    if (!coupon) {
      setError("Mã giảm giá không hợp lệ");
      setAppliedCoupon(null);
      return false;
    }

    if (orderTotal < coupon.minOrder) {
      setError(`Đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(coupon.minOrder)}đ`);
      setAppliedCoupon(null);
      return false;
    }

    setAppliedCoupon(coupon);
    return true;
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setError(null);
  }, []);

  const calculateDiscount = useCallback((orderTotal: number) => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "fixed") return appliedCoupon.discount;
    const discount = Math.floor(orderTotal * appliedCoupon.discount / 100);
    return appliedCoupon.maxDiscount ? Math.min(discount, appliedCoupon.maxDiscount) : discount;
  }, [appliedCoupon]);

  return { appliedCoupon, error, applyCoupon, removeCoupon, calculateDiscount, availableCoupons };
}
