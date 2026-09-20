import { describe, expect, it } from "vitest";
import {
  calculateDeliveryEstimate,
  classifyRoute,
  formatDistance,
  getCurrencyFractionDigits,
  isCurrencyCodeValid,
  parseCurrencyAmount,
  parseRoadFactor,
  type PricingModel,
} from "./delivery";

const model: PricingModel = {
  currency: "EUR",
  baseFeeMinor: 390,
  perKilometerMinor: 85,
  minimumFeeMinor: 490,
  roadFactor: 1.25,
};

describe("currency parsing", () => {
  it("parses decimal point and comma using the selected currency precision", () => {
    expect(parseCurrencyAmount("12.34", "EUR")).toBe(1234);
    expect(parseCurrencyAmount("12,34", "EUR")).toBe(1234);
    expect(parseCurrencyAmount("500", "JPY")).toBe(500);
  });

  it("rejects excess precision and invalid currency codes", () => {
    expect(parseCurrencyAmount("12.345", "EUR")).toBeNull();
    expect(parseCurrencyAmount("500.1", "JPY")).toBeNull();
    expect(isCurrencyCodeValid("EUR")).toBe(true);
    expect(isCurrencyCodeValid("not-money")).toBe(false);
    expect(getCurrencyFractionDigits("KWD")).toBe(3);
  });
});

describe("pricing inputs", () => {
  it("accepts only realistic road factors", () => {
    expect(parseRoadFactor("1.25")).toBe(1.25);
    expect(parseRoadFactor("0.9")).toBeNull();
    expect(parseRoadFactor("3.1")).toBeNull();
  });
});

describe("delivery estimate", () => {
  it("classifies route scale from modeled road distance", () => {
    expect(classifyRoute(4_999)).toBe("local");
    expect(classifyRoute(10_000)).toBe("metro");
    expect(classifyRoute(80_000)).toBe("regional");
    expect(classifyRoute(100_000)).toBe("long-distance");
  });

  it("builds a deterministic standard planning estimate", () => {
    const estimate = calculateDeliveryEstimate(8_000, model, "standard");

    expect(estimate.estimatedRoadMeters).toBe(10_000);
    expect(estimate.distanceChargeMinor).toBe(850);
    expect(estimate.feeMidMinor).toBe(1_240);
    expect(estimate.feeLowMinor).toBeLessThan(estimate.feeMidMinor);
    expect(estimate.feeHighMinor).toBeGreaterThan(estimate.feeMidMinor);
    expect(estimate.routeClass).toBe("metro");
  });

  it("keeps the minimum fee as a hard floor", () => {
    const estimate = calculateDeliveryEstimate(100, model, "economy");
    expect(estimate.feeLowMinor).toBeGreaterThanOrEqual(model.minimumFeeMinor);
  });

  it("marks international routes without changing the user's pricing model", () => {
    const local = calculateDeliveryEstimate(50_000, model, "express", false);
    const international = calculateDeliveryEstimate(50_000, model, "express", true);

    expect(international.international).toBe(true);
    expect(international.feeMidMinor).toBe(local.feeMidMinor);
  });
});

describe("presentation helpers", () => {
  it("formats meters and kilometers proportionally", () => {
    expect(formatDistance(650)).toBe("650 m");
    expect(formatDistance(1_250)).toBe("1.25 km");
    expect(formatDistance(12_500)).toBe("12.5 km");
  });
});
