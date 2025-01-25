// src/utils/distance.ts

/**
 * Straight line (Haversine) distance in meters.
 */
export function calculateDistance(
  userLat: number,
  userLon: number,
  venueLat: number,
  venueLon: number
): number {
  const R = 6371e3;
  const toRad = (v: number) => (v * Math.PI) / 180;

  const φ1 = toRad(userLat);
  const φ2 = toRad(venueLat);
  const Δφ = toRad(venueLat - userLat);
  const Δλ = toRad(venueLon - userLon);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in meters
}
