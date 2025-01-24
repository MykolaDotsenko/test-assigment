import { DistanceRange } from "../types/type";


export function calcSmallOrderSurcharge(
  cartValue: number,
  orderMin: number
): number {
  return Math.max(0, orderMin - cartValue);
}

export function calcDeliveryFee(
  basePrice: number,
  distance: number,
  distanceRanges: DistanceRange[]
): number {
  //correct range
  for (const range of distanceRanges) {
    const upperBound = range.max === 0 ? Number.MAX_SAFE_INTEGER : range.max;
    if (distance >= range.min && distance < upperBound) {
      const distanceComponent = Math.round((range.b * distance) / 10);
      return basePrice + range.a + distanceComponent;
    }
  }
  return -1;
}

export function calcTotal(cartValue: number, deliveryFee: number, surcharge: number) {
  return cartValue + deliveryFee + surcharge;
}
