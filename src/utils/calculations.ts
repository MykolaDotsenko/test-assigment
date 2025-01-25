import { DistanceRange } from "../types/type";


export function calcSmallOrderSurcharge(
  cartValue: number,
  orderMinNoSurcharge: number
): number {
  return Math.max(0, orderMinNoSurcharge - cartValue);
}

export function calcDeliveryFee(
  basePrice: number,
  distance: number,
  distanceRanges: DistanceRange[]
): number {
  for (const range of distanceRanges) {
    // "max=0 => not available for >= min"
    if (range.max === 0) {
      continue;
    }

    if (distance >= range.min && distance < range.max) {
      const distanceComponent = Math.round((range.b * distance) / 10);
      return basePrice + range.a + distanceComponent;
    }
  }
  return -1; // no matching => delivery not possible
}

export function calcTotal(
  cartValue: number,
  deliveryFee: number,
  surcharge: number
): number {
  return cartValue + deliveryFee + surcharge;
}
