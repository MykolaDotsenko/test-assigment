import type { DistanceRange, VenueProfile } from "../domain/delivery";

const BASE_URL =
  "https://consumer-api.development.dev.woltapi.com/home-assignment-api/v1/venues";
const REQUEST_TIMEOUT_MS = 7_000;

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
  const parsed = {
    min: asNumber(range.min, "distance range min"),
    max: asNumber(range.max, "distance range max"),
    a: asNumber(range.a, "distance range a"),
    b: asNumber(range.b, "distance range b"),
  };

  if (parsed.min < 0 || parsed.max < 0 || parsed.a < 0 || parsed.b < 0) {
    throw new VenueDataError("Delivery pricing contains a negative range value.");
  }

  if (parsed.max !== 0 && parsed.max <= parsed.min) {
    throw new VenueDataError("Delivery pricing contains an invalid finite distance range.");
  }

  return parsed;
}

function validateDistanceRanges(ranges: DistanceRange[]): void {
  let previousFiniteMax: number | null = null;

  ranges.forEach((range, index) => {
    if (index > 0 && range.min < ranges[index - 1].min) {
      throw new VenueDataError("Delivery distance ranges are not ordered by minimum distance.");
    }

    if (previousFiniteMax !== null && range.min < previousFiniteMax) {
      throw new VenueDataError("Delivery distance ranges overlap.");
    }

    if (range.max === 0) {
      if (index !== ranges.length - 1) {
        throw new VenueDataError("The open-ended delivery range must be the final range.");
      }
      return;
    }

    previousFiniteMax = range.max;
  });
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

  const longitude = asNumber(coordinates[0], "venue longitude");
  const latitude = asNumber(coordinates[1], "venue latitude");

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new VenueDataError("Venue coordinates are outside valid geographic bounds.");
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

  validateDistanceRanges(distanceRanges);

  const orderMinimumNoSurcharge = asNumber(
    deliverySpecs.order_minimum_no_surcharge,
    "order minimum without surcharge",
  );
  const basePrice = asNumber(deliveryPricing.base_price, "base delivery price");

  if (orderMinimumNoSurcharge < 0 || basePrice < 0) {
    throw new VenueDataError("Venue pricing cannot contain negative money values.");
  }

  return {
    slug,
    location: { longitude, latitude },
    orderMinimumNoSurcharge,
    basePrice,
    distanceRanges,
  };
}

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new VenueDataError(
      response.status === 404
        ? "This venue slug could not be found."
        : `Venue service returned HTTP ${response.status}.`,
    );
  }

  return response.json() as Promise<unknown>;
}

export async function fetchVenueProfile(slug: string, signal?: AbortSignal): Promise<VenueProfile> {
  const requestController = new AbortController();
  const forwardAbort = () => requestController.abort();

  if (signal?.aborted) {
    requestController.abort();
  } else {
    signal?.addEventListener("abort", forwardAbort, { once: true });
  }

  const timeoutId = window.setTimeout(() => requestController.abort(), REQUEST_TIMEOUT_MS);

  try {
    const encodedSlug = encodeURIComponent(slug);
    const [staticPayload, dynamicPayload] = await Promise.all([
      fetchJson(`${BASE_URL}/${encodedSlug}/static`, requestController.signal),
      fetchJson(`${BASE_URL}/${encodedSlug}/dynamic`, requestController.signal),
    ]);

    return parseVenueProfile(slug, staticPayload, dynamicPayload);
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    if (error instanceof VenueDataError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new VenueDataError("The venue service timed out. Try the quote again.");
    }

    throw new VenueDataError(
      "The venue service is unavailable or returned unreadable data. Try again shortly.",
    );
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", forwardAbort);
  }
}
