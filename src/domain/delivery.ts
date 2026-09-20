export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type ServiceLevel = "economy" | "standard" | "express";
export type RouteClass = "local" | "metro" | "regional" | "long-distance";

export interface PricingModel {
  currency: string;
  baseFeeMinor: number;
  perKilometerMinor: number;
  minimumFeeMinor: number;
  roadFactor: number;
}

export interface DeliveryEstimate {
  straightLineMeters: number;
  estimatedRoadMeters: number;
  routeClass: RouteClass;
  serviceLevel: ServiceLevel;
  serviceMultiplier: number;
  distanceChargeMinor: number;
  feeMidMinor: number;
  feeLowMinor: number;
  feeHighMinor: number;
  etaMinMinutes: number;
  etaMaxMinutes: number;
  international: boolean;
}

interface ServiceProfile {
  multiplier: number;
  localSpeedKmh: number;
  longDistanceSpeedKmh: number;
  pickupMinMinutes: number;
  pickupMaxMinutes: number;
}

const SERVICE_PROFILES: Record<ServiceLevel, ServiceProfile> = {
  economy: {
    multiplier: 0.85,
    localSpeedKmh: 19,
    longDistanceSpeedKmh: 62,
    pickupMinMinutes: 18,
    pickupMaxMinutes: 32,
  },
  standard: {
    multiplier: 1,
    localSpeedKmh: 27,
    longDistanceSpeedKmh: 72,
    pickupMinMinutes: 12,
    pickupMaxMinutes: 24,
  },
  express: {
    multiplier: 1.35,
    localSpeedKmh: 36,
    longDistanceSpeedKmh: 82,
    pickupMinMinutes: 8,
    pickupMaxMinutes: 16,
  },
};

export function getCurrencyFractionDigits(currency: string): number | null {
  try {
    const digits = new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency.trim().toUpperCase(),
    }).resolvedOptions().maximumFractionDigits ?? 2;

    return Math.min(3, Math.max(0, digits));
  } catch {
    return null;
  }
}

export function isCurrencyCodeValid(currency: string): boolean {
  const normalized = currency.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) && getCurrencyFractionDigits(normalized) !== null;
}

export function parseCurrencyAmount(raw: string, currency: string): number | null {
  const digits = getCurrencyFractionDigits(currency);
  if (digits === null) return null;

  const normalized = raw.trim().replace(",", ".");
  const pattern =
    digits === 0 ? /^\d+$/ : new RegExp(`^\\d+(?:\\.\\d{0,${digits}})?$`);

  if (!pattern.test(normalized)) return null;

  const [whole, fraction = ""] = normalized.split(".");
  const factor = 10 ** digits;
  const amount = Number(whole) * factor + Number(fraction.padEnd(digits, "0"));

  if (!Number.isSafeInteger(amount) || amount < 0 || amount > 1_000_000_000) {
    return null;
  }

  return amount;
}

export function parseRoadFactor(raw: string): number | null {
  const value = Number(raw.trim().replace(",", "."));
  if (!Number.isFinite(value) || value < 1 || value > 3) return null;
  return value;
}

export function classifyRoute(estimatedRoadMeters: number): RouteClass {
  const kilometers = estimatedRoadMeters / 1000;
  if (kilometers < 5) return "local";
  if (kilometers < 20) return "metro";
  if (kilometers < 100) return "regional";
  return "long-distance";
}

export function calculateDeliveryEstimate(
  straightLineMeters: number,
  model: PricingModel,
  serviceLevel: ServiceLevel,
  international = false,
): DeliveryEstimate {
  const safeStraightMeters = Math.max(0, straightLineMeters);
  const estimatedRoadMeters = Math.max(
    safeStraightMeters,
    Math.round(safeStraightMeters * model.roadFactor),
  );
  const estimatedRoadKilometers = estimatedRoadMeters / 1000;
  const profile = SERVICE_PROFILES[serviceLevel];
  const routeClass = classifyRoute(estimatedRoadMeters);

  const distanceChargeMinor = Math.round(model.perKilometerMinor * estimatedRoadKilometers);
  const beforeService = Math.max(
    model.minimumFeeMinor,
    model.baseFeeMinor + distanceChargeMinor,
  );
  const feeMidMinor = Math.max(
    model.minimumFeeMinor,
    Math.round(beforeService * profile.multiplier),
  );

  const uncertainty =
    routeClass === "local"
      ? { low: 0.92, high: 1.12 }
      : routeClass === "metro"
        ? { low: 0.9, high: 1.16 }
        : routeClass === "regional"
          ? { low: 0.85, high: 1.25 }
          : { low: 0.75, high: 1.4 };

  const feeLowMinor = Math.max(
    model.minimumFeeMinor,
    Math.round(feeMidMinor * uncertainty.low),
  );
  const feeHighMinor = Math.max(feeLowMinor, Math.round(feeMidMinor * uncertainty.high));

  const speedKmh =
    estimatedRoadKilometers > 50 ? profile.longDistanceSpeedKmh : profile.localSpeedKmh;
  const driveMinutes = speedKmh > 0 ? (estimatedRoadKilometers / speedKmh) * 60 : 0;

  const etaMinMinutes = Math.max(
    10,
    Math.round(driveMinutes * 0.88 + profile.pickupMinMinutes),
  );
  const etaMaxMinutes = Math.max(
    etaMinMinutes + 5,
    Math.round(driveMinutes * 1.28 + profile.pickupMaxMinutes),
  );

  return {
    straightLineMeters: Math.round(safeStraightMeters),
    estimatedRoadMeters,
    routeClass,
    serviceLevel,
    serviceMultiplier: profile.multiplier,
    distanceChargeMinor,
    feeMidMinor,
    feeLowMinor,
    feeHighMinor,
    etaMinMinutes,
    etaMaxMinutes,
    international,
  };
}

export function formatMoney(amountMinor: number, currency: string): string {
  const normalized = currency.trim().toUpperCase();
  const digits = getCurrencyFractionDigits(normalized) ?? 2;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: normalized,
  }).format(amountMinor / 10 ** digits);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const kilometers = meters / 1000;
  return `${kilometers.toFixed(kilometers >= 100 ? 0 : kilometers >= 10 ? 1 : 2)} km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function serviceLabel(level: ServiceLevel): string {
  if (level === "economy") return "Economy";
  if (level === "express") return "Express";
  return "Standard";
}

export function routeClassLabel(routeClass: RouteClass): string {
  if (routeClass === "local") return "Local";
  if (routeClass === "metro") return "Metro";
  if (routeClass === "regional") return "Regional";
  return "Long-distance";
}
