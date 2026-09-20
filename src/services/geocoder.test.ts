import { describe, expect, it } from "vitest";
import { parseOpenMeteoPayload, parsePhotonPayload } from "./geocoder";

describe("Photon boundary", () => {
  it("normalizes valid GeoJSON features", () => {
    const matches = parsePhotonPayload({
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [22.2666, 60.4518] },
          properties: {
            osm_type: "N",
            osm_id: 1,
            name: "Turku",
            state: "Southwest Finland",
            country: "Finland",
            countrycode: "FI",
          },
        },
      ],
    });

    expect(matches).toHaveLength(1);
    expect(matches[0].label).toContain("Turku");
    expect(matches[0].countryCode).toBe("FI");
    expect(matches[0].coordinates.latitude).toBe(60.4518);
  });

  it("drops malformed coordinates instead of leaking them into the domain", () => {
    expect(
      parsePhotonPayload({
        features: [
          {
            geometry: { coordinates: [300, 100] },
            properties: { name: "Impossible" },
          },
        ],
      }),
    ).toEqual([]);
  });
});

describe("Open-Meteo fallback boundary", () => {
  it("normalizes global locality results", () => {
    const matches = parseOpenMeteoPayload({
      results: [
        {
          id: 658225,
          name: "Helsinki",
          latitude: 60.16952,
          longitude: 24.93545,
          admin1: "Uusimaa",
          country: "Finland",
          country_code: "FI",
        },
      ],
    });

    expect(matches[0]).toMatchObject({
      name: "Helsinki",
      countryCode: "FI",
      source: "open-meteo",
    });
    expect(matches[0].label).toContain("Finland");
  });
});
