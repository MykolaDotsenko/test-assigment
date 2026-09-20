import type { Coordinates } from "../domain/delivery";

const PHOTON_URL = "https://photon.komoot.io/api/";
const OPEN_METEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const REQUEST_TIMEOUT_MS = 6_000;
const MAX_RESULTS = 5;

type UnknownRecord = Record<string, unknown>;

export interface PlaceMatch {
  id: string;
  label: string;
  name: string;
  secondary: string;
  coordinates: Coordinates;
  country?: string;
  countryCode?: string;
  source: "photon" | "open-meteo";
}

export class GeocodingError extends Error {
  constructor(
    message: string,
    public readonly kind: "invalid" | "not-found" | "unavailable" = "unavailable",
  ) {
    super(message);
    this.name = "GeocodingError";
  }
}

const queryCache = new Map<string, PlaceMatch[]>();

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isValidCoordinate(latitude: number, longitude: number): boolean {
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function uniqueParts(parts: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  return parts.filter((part): part is string => {
    if (!part) return false;
    const key = part.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildLabel(name: string, parts: Array<string | undefined>): {
  label: string;
  secondary: string;
} {
  const secondaryParts = uniqueParts(parts).filter(
    (part) => part.toLocaleLowerCase() !== name.toLocaleLowerCase(),
  );
  return {
    label: [name, ...secondaryParts].join(", "),
    secondary: secondaryParts.join(", "),
  };
}

export function parsePhotonPayload(payload: unknown): PlaceMatch[] {
  const root = asRecord(payload);
  const features = Array.isArray(root?.features) ? root.features : [];

  const matches = features
    .map((feature, index): PlaceMatch | null => {
      const featureRecord = asRecord(feature);
      const properties = asRecord(featureRecord?.properties);
      const geometry = asRecord(featureRecord?.geometry);
      const coordinates = Array.isArray(geometry?.coordinates) ? geometry.coordinates : [];

      const longitude = asFiniteNumber(coordinates[0]);
      const latitude = asFiniteNumber(coordinates[1]);
      const name =
        asString(properties?.name) ??
        asString(properties?.street) ??
        asString(properties?.city) ??
        asString(properties?.country);

      if (
        longitude === null ||
        latitude === null ||
        !name ||
        !isValidCoordinate(latitude, longitude)
      ) {
        return null;
      }

      const street = asString(properties?.street);
      const houseNumber = asString(properties?.housenumber);
      const streetLine =
        street && houseNumber ? `${street} ${houseNumber}` : street ?? houseNumber;
      const city = asString(properties?.city) ?? asString(properties?.locality);
      const district = asString(properties?.district);
      const state = asString(properties?.state);
      const postcode = asString(properties?.postcode);
      const country = asString(properties?.country);
      const countryCode = asString(properties?.countrycode)?.toUpperCase();
      const { label, secondary } = buildLabel(name, [
        streetLine,
        district,
        city,
        postcode,
        state,
        country,
      ]);

      return {
        id: `photon-${asString(properties?.osm_type) ?? "x"}-${String(
          properties?.osm_id ?? index,
        )}`,
        label,
        name,
        secondary,
        coordinates: { latitude, longitude },
        country,
        countryCode,
        source: "photon",
      };
    })
    .filter((match): match is PlaceMatch => match !== null);

  return dedupeMatches(matches);
}

export function parseOpenMeteoPayload(payload: unknown): PlaceMatch[] {
  const root = asRecord(payload);
  const results = Array.isArray(root?.results) ? root.results : [];

  const matches = results
    .map((result, index): PlaceMatch | null => {
      const record = asRecord(result);
      if (!record) return null;

      const latitude = asFiniteNumber(record.latitude);
      const longitude = asFiniteNumber(record.longitude);
      const name = asString(record.name);

      if (
        latitude === null ||
        longitude === null ||
        !name ||
        !isValidCoordinate(latitude, longitude)
      ) {
        return null;
      }

      const admin1 = asString(record.admin1);
      const country = asString(record.country);
      const countryCode = asString(record.country_code)?.toUpperCase();
      const { label, secondary } = buildLabel(name, [admin1, country]);

      return {
        id: `open-meteo-${String(record.id ?? index)}`,
        label,
        name,
        secondary,
        coordinates: { latitude, longitude },
        country,
        countryCode,
        source: "open-meteo",
      };
    })
    .filter((match): match is PlaceMatch => match !== null);

  return dedupeMatches(matches);
}

function dedupeMatches(matches: PlaceMatch[]): PlaceMatch[] {
  const seen = new Set<string>();
  return matches.filter((match) => {
    const key = `${match.label.toLocaleLowerCase()}|${match.coordinates.latitude.toFixed(
      4,
    )}|${match.coordinates.longitude.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchJson(url: string, externalSignal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const forwardAbort = () => controller.abort();

  if (externalSignal?.aborted) {
    controller.abort();
  } else {
    externalSignal?.addEventListener("abort", forwardAbort, { once: true });
  }

  const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new GeocodingError(`Place search returned HTTP ${response.status}.`);
    }

    return (await response.json()) as unknown;
  } finally {
    globalThis.clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", forwardAbort);
  }
}

function languageCode(): string {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.toLowerCase().split("-")[0] || "en";
}

async function searchPhoton(query: string, signal?: AbortSignal): Promise<PlaceMatch[]> {
  const url = new URL(PHOTON_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(MAX_RESULTS));

  const payload = await fetchJson(url.toString(), signal);
  return parsePhotonPayload(payload).slice(0, MAX_RESULTS);
}

async function searchOpenMeteo(query: string, signal?: AbortSignal): Promise<PlaceMatch[]> {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("name", query);
  url.searchParams.set("count", String(MAX_RESULTS));
  url.searchParams.set("language", languageCode());
  url.searchParams.set("format", "json");

  const payload = await fetchJson(url.toString(), signal);
  return parseOpenMeteoPayload(payload).slice(0, MAX_RESULTS);
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceMatch[]> {
  const normalized = query.trim().replace(/\s+/g, " ");
  if (normalized.length < 2 || normalized.length > 160) {
    throw new GeocodingError(
      "Enter at least two characters and keep the place description under 160 characters.",
      "invalid",
    );
  }

  const cacheKey = normalized.toLocaleLowerCase();
  const cached = queryCache.get(cacheKey);
  if (cached) return cached;

  let photonUnavailable = false;

  try {
    const photonMatches = await searchPhoton(normalized, signal);
    if (photonMatches.length > 0) {
      queryCache.set(cacheKey, photonMatches);
      return photonMatches;
    }
  } catch (error) {
    if (signal?.aborted) throw error;
    photonUnavailable = true;
  }

  try {
    const fallbackMatches = await searchOpenMeteo(normalized, signal);
    if (fallbackMatches.length > 0) {
      queryCache.set(cacheKey, fallbackMatches);
      return fallbackMatches;
    }
  } catch (error) {
    if (signal?.aborted) throw error;
    if (photonUnavailable) {
      throw new GeocodingError(
        "Global place search is temporarily unavailable. Try again in a moment.",
        "unavailable",
      );
    }
  }

  throw new GeocodingError(
    "No matching place was found. Add a city or country, for example “Turku, Finland”.",
    "not-found",
  );
}
