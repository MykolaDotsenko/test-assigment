export const calcSmallOrder = (cartValue: number): number => {
  const MIN_CART_VALUE = 10;
  return cartValue < MIN_CART_VALUE ? MIN_CART_VALUE - cartValue : 0;
};

export const calcDeliv = (distance: number): number => {
  const MIN_DELIVERY_DISTANCE = 1000;
  const BASE_FEE = 2;
  const DELIVERY_FEE_PER_KM = 1;

  if (distance <= MIN_DELIVERY_DISTANCE) {
    return BASE_FEE;
  }

  const extraDistance = distance - MIN_DELIVERY_DISTANCE;
  const extraFee = Math.ceil(extraDistance / 500) * DELIVERY_FEE_PER_KM;

  return BASE_FEE + extraFee;
};


export const calcTotal = (
  cartValue: number,
  deliveryFee: number,
  surcharge: number
): number => {
  return cartValue + deliveryFee + surcharge;
};