import axios from "axios";
import type { DistanceRange, VenueProfile } from "../domain/delivery";

const BASE_URL =
  "https://consumer-api.development.dev.woltapi.com/home-assignment-api/v1/venues";

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 7_000,
});

type UnknownRecord = Record<string, unknown>;

export class VenueDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VenueDataError";
  }
}

function asRecord(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new VenueDataError(`Invalid ${label} payload.`);
  }
  return value as UnknownRecord;
}

function asNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new VenueDataError(`Invalid numeric field: ${label}.`);
  }
  return value;
}

function asArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new VenueDataError(`Invalid array field: ${label}.`);
  }
  return value;
}

function parseDistanceRange(value: unknown): DistanceRange {
  const range = asRecord(value, "distance range");
  return {
    min: asNumber(range.min, "distance range min"),
    max: asNumber(range.max, "distance range max"),
    a: asNumber(range.a, "distance range a"),
    b: asNumber(range.b, "distance range b"),
  };
}

export function parseVenueProfile(
  slug: string,
  staticPayload: unknown,
  dynamicPayload: unknown,
): VenueProfile {
  const staticRoot = asRecord(staticPayload, "static venue");
  const staticVenue = asRecord(staticRoot.venue_raw, "static venue_raw");
  const location = asRecord(staticVenue.location, "venue location");
  const coordinates = asArray(location.coordinates, "venue coordinates");

  if (coordinates.length < 2) {
    throw new VenueDataError("Venue coordinates are incomplete.");
  }

  const dynamicRoot = asRecord(dynamicPayload, "dynamic venue");
  const dynamicVenue = asRecord(dynamicRoot.venue_raw, "dynamic venue_raw");
  const deliverySpecs = asRecord(dynamicVenue.delivery_specs, "delivery specs");
  const deliveryPricing = asRecord(deliverySpecs.delivery_pricing, "delivery pricing");
  const distanceRanges = asArray(deliveryPricing.distance_ranges, "distance ranges").map(
    parseDistanceRange,
  );

  if (distanceRanges.length === 0) {
    throw new VenueDataError("Venue does not expose delivery distance ranges.");
  }

  return {
    slug,
    location: {
      longitude: asNumber(coordinates[0], "venue longitude"),
      latitude: asNumber(coordinates[1], "venue latitude"),
    },
    orderMinimumNoSurcharge: asNumber(
      deliverySpecs.order_minimum_no_surcharge,
      "order minimum without surcharge",
    ),
    basePrice: asNumber(deliveryPricing.base_price, "base delivery price"),
    distanceRanges,
  };
}

export async function fetchVenueProfile(slug: string, signal?: AbortSignal): Promise<VenueProfile> {
  try {
    const [staticResponse, dynamicResponse] = await Promise.all([
      apiClient.get(`/${encodeURIComponent(slug)}/static`, { signal }),
      apiClient.get(`/${encodeURIComponent(slug)}/dynamic`, { signal }),
    ]);

    return parseVenueProfile(slug, staticResponse.data, dynamicResponse.data);
  } catch (error) {
    if (axios.isCancel(error) || (error instanceof DOMException && error.name === "AbortError")) {
      throw error;
    }

    if (error instanceof VenueDataError) {
      throw error;
    }

    throw new VenueDataError(
      "The venue service is unavailable or the venue slug could not be resolved. Try again shortly.",
    );
  }
}
