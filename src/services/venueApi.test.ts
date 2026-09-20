import { describe, expect, it } from "vitest";
import { parseVenueProfile, VenueDataError } from "./venueApi";

const staticPayload = {
  venue_raw: {
    location: { coordinates: [24.93087, 60.17094] },
  },
};

const dynamicPayload = {
  venue_raw: {
    delivery_specs: {
      order_minimum_no_surcharge: 1_000,
      delivery_pricing: {
        base_price: 190,
        distance_ranges: [
          { min: 0, max: 500, a: 0, b: 0, flag: null },
          { min: 500, max: 0, a: 0, b: 0, flag: null },
        ],
      },
    },
  },
};

function withRanges(distanceRanges: unknown[]) {
  return {
    venue_raw: {
      delivery_specs: {
        order_minimum_no_surcharge: 1_000,
        delivery_pricing: {
          base_price: 190,
          distance_ranges: distanceRanges,
        },
      },
    },
  };
}

describe("venue API boundary", () => {
  it("normalizes valid payloads into the domain profile", () => {
    const profile = parseVenueProfile("demo-venue", staticPayload, dynamicPayload);
    expect(profile.location).toEqual({ longitude: 24.93087, latitude: 60.17094 });
    expect(profile.orderMinimumNoSurcharge).toBe(1_000);
    expect(profile.distanceRanges).toHaveLength(2);
  });

  it("rejects malformed payloads before they reach pricing", () => {
    expect(() => parseVenueProfile("demo-venue", {}, dynamicPayload)).toThrow(VenueDataError);
    expect(() =>
      parseVenueProfile("demo-venue", staticPayload, {
        venue_raw: { delivery_specs: { delivery_pricing: { distance_ranges: [] } } },
      }),
    ).toThrow(VenueDataError);
  });

  it("rejects finite ranges whose maximum does not exceed their minimum", () => {
    expect(() =>
      parseVenueProfile(
        "demo-venue",
        staticPayload,
        withRanges([{ min: 500, max: 500, a: 0, b: 0 }]),
      ),
    ).toThrow("invalid finite distance range");
  });

  it("rejects overlapping distance ranges", () => {
    expect(() =>
      parseVenueProfile(
        "demo-venue",
        staticPayload,
        withRanges([
          { min: 0, max: 700, a: 0, b: 0 },
          { min: 500, max: 1_000, a: 0, b: 0 },
        ]),
      ),
    ).toThrow("overlap");
  });

  it("rejects an open-ended sentinel before the final range", () => {
    expect(() =>
      parseVenueProfile(
        "demo-venue",
        staticPayload,
        withRanges([
          { min: 0, max: 0, a: 0, b: 0 },
          { min: 500, max: 1_000, a: 0, b: 0 },
        ]),
      ),
    ).toThrow("must be the final range");
  });
});
