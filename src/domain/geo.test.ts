import { describe, expect, it } from "vitest";
import { calculateDistance } from "./geo";

describe("Haversine distance", () => {
  it("returns zero for the same point", () => {
    const point = { latitude: 60.1699, longitude: 24.9384 };
    expect(calculateDistance(point, point)).toBe(0);
  });

  it("is symmetric", () => {
    const a = { latitude: 60.1699, longitude: 24.9384 };
    const b = { latitude: 60.1842, longitude: 24.9522 };
    expect(calculateDistance(a, b)).toBeCloseTo(calculateDistance(b, a), 8);
  });

  it("produces a plausible Helsinki inner-city distance", () => {
    const central = { latitude: 60.1699, longitude: 24.9384 };
    const kallio = { latitude: 60.1842, longitude: 24.9522 };
    const distance = calculateDistance(central, kallio);
    expect(distance).toBeGreaterThan(1_500);
    expect(distance).toBeLessThan(2_000);
  });
});
