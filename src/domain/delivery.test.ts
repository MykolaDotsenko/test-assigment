import { describe, expect, it } from "vitest";
import {
  calcSmallOrderSurcharge,
  calculateDeliveryQuote,
  findDistanceRange,
  formatDistance,
  getMaxDeliveryDistance,
  isVenueSlugValid,
  parseCoordinate,
  parseMoneyToCents,
  type VenueProfile,
} from "./delivery";

const profile: VenueProfile = {
  slug: "home-assignment-venue-helsinki",
  location: { latitude: 60.17, longitude: 24.94 },
  orderMinimumNoSurcharge: 1_000,
  basePrice: 190,
  distanceRanges: [
    { min: 0, max: 500, a: 0, b: 0 },
    { min: 500, max: 1_000, a: 100, b: 1 },
    { min: 1_000, max: 0, a: 0, b: 0 },
  ],
};

describe("money parsing", () => {
  it("parses decimal point and decimal comma without floating point drift", () => {
    expect(parseMoneyToCents("12.34")).toBe(1234);
    expect(parseMoneyToCents("12,34")).toBe(1234);
    expect(parseMoneyToCents("12.3")).toBe(1230);
  });

  it("rejects malformed and over-precise money", () => {
    expect(parseMoneyToCents("12.345")).toBeNull();
    expect(parseMoneyToCents("-2")).toBeNull();
    expect(parseMoneyToCents("hello")).toBeNull();
  });
});

describe("input boundaries", () => {
  it("validates coordinate ranges", () => {
    expect(parseCoordinate("60.17", "latitude")).toBe(60.17);
    expect(parseCoordinate("90.1", "latitude")).toBeNull();
    expect(parseCoordinate("181", "longitude")).toBeNull();
  });

  it("accepts normalized venue slugs only", () => {
    expect(isVenueSlugValid("home-assignment-venue-helsinki")).toBe(true);
    expect(isVenueSlugValid("Home Assignment")).toBe(false);
  });
});

describe("delivery pricing", () => {
  it("calculates surcharge as the exact gap to the venue threshold", () => {
    expect(calcSmallOrderSurcharge(750, 1_000)).toBe(250);
    expect(calcSmallOrderSurcharge(1_200, 1_000)).toBe(0);
  });

  it("treats max=0 as the unavailable sentinel", () => {
    expect(findDistanceRange(999, profile.distanceRanges)).toEqual(profile.distanceRanges[1]);
    expect(findDistanceRange(1_000, profile.distanceRanges)).toBeNull();
    expect(getMaxDeliveryDistance(profile.distanceRanges)).toBe(1_000);
  });

  it("returns an inspectable available quote", () => {
    const quote = calculateDeliveryQuote(
      profile,
      { cartValueCents: 800, customerLocation: { latitude: 60.17, longitude: 24.94 } },
      750,
    );

    expect(quote.available).toBe(true);
    expect(quote.smallOrderSurchargeCents).toBe(200);
    expect(quote.deliveryFeeCents).toBe(365);
    expect(quote.totalCents).toBe(1_365);
    expect(quote.distanceUtilization).toBe(0.75);
  });

  it("returns outside-area state instead of a magic negative fee", () => {
    const quote = calculateDeliveryQuote(
      profile,
      { cartValueCents: 1_200, customerLocation: { latitude: 60.17, longitude: 24.94 } },
      1_050,
    );

    expect(quote.available).toBe(false);
    expect(quote.deliveryFeeCents).toBeNull();
    expect(quote.totalCents).toBeNull();
  });
});

describe("presentation helpers", () => {
  it("formats meters and kilometers proportionally", () => {
    expect(formatDistance(650)).toBe("650 m");
    expect(formatDistance(1_250)).toBe("1.3 km");
  });
});
