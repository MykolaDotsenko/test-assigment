export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DistanceRange {
  min: number;
  max: number;
  a: number;
  b: number;
}

export interface VenueProfile {
  slug: string;
  location: Coordinates;
  orderMinimumNoSurcharge: number;
  basePrice: number;
  distanceRanges: DistanceRange[];
}

export interface DeliveryQuote {
  available: boolean;
  cartValueCents: number;
  smallOrderSurchargeCents: number;
  deliveryFeeCents: number | null;
  totalCents: number | null;
  distanceMeters: number;
  maxDeliveryDistanceMeters: number | null;
  distanceUtilization: number | null;
  amountUntilNoSurchargeCents: number;
  matchedRange: DistanceRange | null;
}

export interface QuoteInput {
  cartValueCents: number;
  customerLocation: Coordinates;
}

export function parseMoneyToCents(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");

  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) {
    return null;
  }

  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));

  if (!Number.isSafeInteger(cents) || cents < 0 || cents > 100_000_000) {
    return null;
  }

  return cents;
}

export function parseCoordinate(raw: string, kind: "latitude" | "longitude"): number | null {
  const value = Number(raw.trim().replace(",", "."));
  const min = kind === "latitude" ? -90 : -180;
  const max = kind === "latitude" ? 90 : 180;

  if (!Number.isFinite(value) || value < min || value > max) {
    return null;
  }

  return value;
}

export function isVenueSlugValid(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim()) && value.trim().length <= 120;
}

export function calcSmallOrderSurcharge(cartValueCents: number, orderMinimumCents: number): number {
  return Math.max(0, orderMinimumCents - cartValueCents);
}

export function getMaxDeliveryDistance(distanceRanges: DistanceRange[]): number | null {
  const unavailableSentinel = distanceRanges.find((range) => range.max === 0);
  if (unavailableSentinel) return unavailableSentinel.min;

  const finiteMaxima = distanceRanges.map((range) => range.max).filter((max) => max > 0);
  return finiteMaxima.length > 0 ? Math.max(...finiteMaxima) : null;
}

export function findDistanceRange(distanceMeters: number, ranges: DistanceRange[]): DistanceRange | null {
  for (const range of ranges) {
    if (range.max === 0 && distanceMeters >= range.min) {
      return null;
    }

    if (range.max > 0 && distanceMeters >= range.min && distanceMeters < range.max) {
      return range;
    }
  }

  return null;
}

export function calculateDeliveryFee(
  basePriceCents: number,
  distanceMeters: number,
  range: DistanceRange,
): number {
  return basePriceCents + range.a + Math.round((range.b * distanceMeters) / 10);
}

export function calculateDeliveryQuote(
  profile: VenueProfile,
  input: QuoteInput,
  distanceMeters: number,
): DeliveryQuote {
  const roundedDistance = Math.max(0, Math.round(distanceMeters));
  const matchedRange = findDistanceRange(roundedDistance, profile.distanceRanges);
  const smallOrderSurchargeCents = calcSmallOrderSurcharge(
    input.cartValueCents,
    profile.orderMinimumNoSurcharge,
  );
  const maxDeliveryDistanceMeters = getMaxDeliveryDistance(profile.distanceRanges);
  const distanceUtilization = maxDeliveryDistanceMeters
    ? Math.min(1, roundedDistance / maxDeliveryDistanceMeters)
    : null;

  if (!matchedRange) {
    return {
      available: false,
      cartValueCents: input.cartValueCents,
      smallOrderSurchargeCents,
      deliveryFeeCents: null,
      totalCents: null,
      distanceMeters: roundedDistance,
      maxDeliveryDistanceMeters,
      distanceUtilization,
      amountUntilNoSurchargeCents: smallOrderSurchargeCents,
      matchedRange: null,
    };
  }

  const deliveryFeeCents = calculateDeliveryFee(profile.basePrice, roundedDistance, matchedRange);

  return {
    available: true,
    cartValueCents: input.cartValueCents,
    smallOrderSurchargeCents,
    deliveryFeeCents,
    totalCents: input.cartValueCents + smallOrderSurchargeCents + deliveryFeeCents,
    distanceMeters: roundedDistance,
    maxDeliveryDistanceMeters,
    distanceUtilization,
    amountUntilNoSurchargeCents: smallOrderSurchargeCents,
    matchedRange,
  };
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-FI", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(meters >= 10_000 ? 0 : 1)} km`;
}
