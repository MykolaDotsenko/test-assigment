import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import QuoteResult from "./QuoteResult";
import RecentQuotes, { type RecentQuote } from "./RecentQuotes";
import {
  calculateDeliveryQuote,
  isVenueSlugValid,
  parseCoordinate,
  parseMoneyToCents,
  type DeliveryQuote,
} from "../domain/delivery";
import { calculateDistance } from "../domain/geo";
import { fetchVenueProfile, VenueDataError } from "../services/venueApi";

interface FormState {
  venueSlug: string;
  cartValue: string;
  latitude: string;
  longitude: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const DEFAULT_FORM: FormState = {
  venueSlug: "home-assignment-venue-helsinki",
  cartValue: "18.50",
  latitude: "60.17094",
  longitude: "24.93087",
};

const LOCATION_PRESETS = [
  { name: "Central", latitude: "60.16990", longitude: "24.93840" },
  { name: "Kamppi", latitude: "60.16860", longitude: "24.93050" },
  { name: "Kallio", latitude: "60.18420", longitude: "24.95220" },
];

function validateForm(form: FormState): {
  errors: FieldErrors;
  parsed: { cartValueCents: number; latitude: number; longitude: number } | null;
} {
  const errors: FieldErrors = {};
  const cartValueCents = parseMoneyToCents(form.cartValue);
  const latitude = parseCoordinate(form.latitude, "latitude");
  const longitude = parseCoordinate(form.longitude, "longitude");

  if (!isVenueSlugValid(form.venueSlug)) {
    errors.venueSlug = "Use a lowercase venue slug such as home-assignment-venue-helsinki.";
  }
  if (cartValueCents === null) {
    errors.cartValue = "Enter a non-negative EUR amount with at most two decimals.";
  }
  if (latitude === null) {
    errors.latitude = "Latitude must be a number between -90 and 90.";
  }
  if (longitude === null) {
    errors.longitude = "Longitude must be a number between -180 and 180.";
  }

  return {
    errors,
    parsed:
      Object.keys(errors).length === 0 && cartValueCents !== null && latitude !== null && longitude !== null
        ? { cartValueCents, latitude, longitude }
        : null,
  };
}

export default function Calculator() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState("");
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [recentQuotes, setRecentQuotes] = useState<RecentQuote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const setField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setRequestError("");
  };

  const usePreset = (latitude: string, longitude: string) => {
    setForm((current) => ({ ...current, latitude, longitude }));
    setFieldErrors((current) => ({ ...current, latitude: undefined, longitude: undefined }));
  };

  const handleLocation = () => {
    setRequestError("");
    if (!navigator.geolocation) {
      setRequestError("Geolocation is not supported by this browser. Enter coordinates manually.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setFieldErrors((current) => ({ ...current, latitude: undefined, longitude: undefined }));
        setIsLocating(false);
      },
      () => {
        setRequestError("Location permission was unavailable. Your coordinates were not changed.");
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 60_000 },
    );
  };

  const handleCalculate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateForm(form);
    setFieldErrors(validation.errors);
    setRequestError("");

    if (!validation.parsed) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);

    try {
      const profile = await fetchVenueProfile(form.venueSlug.trim(), controller.signal);
      const customerLocation = {
        latitude: validation.parsed.latitude,
        longitude: validation.parsed.longitude,
      };
      const distanceMeters = calculateDistance(customerLocation, profile.location);
      const nextQuote = calculateDeliveryQuote(
        profile,
        { cartValueCents: validation.parsed.cartValueCents, customerLocation },
        distanceMeters,
      );

      setQuote(nextQuote);
      setRecentQuotes((current) => [
        {
          id: `${Date.now()}-${Math.round(distanceMeters)}`,
          totalCents: nextQuote.totalCents,
          distanceMeters: nextQuote.distanceMeters,
          cartValueCents: nextQuote.cartValueCents,
          available: nextQuote.available,
        },
        ...current,
      ].slice(0, 4));
    } catch (error) {
      if (controller.signal.aborted) return;
      setQuote(null);
      setRequestError(
        error instanceof VenueDataError
          ? error.message
          : "The quote could not be calculated. Check the venue and try again.",
      );
    } finally {
      if (abortRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="brand-mark" aria-hidden="true">
          <span />
        </div>
        <div className="hero-copy">
          <span className="eyebrow">Radius · Delivery Quote Lab</span>
          <h1>Know the delivery cost before checkout does.</h1>
          <p>
            A transparent delivery-fee explorer built from a real home-assignment API: live venue rules,
            local pricing math, and no hidden state.
          </p>
          <div className="trust-row" aria-label="Product principles">
            <span>Live venue data</span>
            <span>Local calculation</span>
            <span>No tracking</span>
          </div>
        </div>
      </header>

      <div className="workspace-grid">
        <section className="composer-card" aria-labelledby="quote-builder-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Build a quote</span>
              <h2 id="quote-builder-title">Delivery inputs</h2>
            </div>
            <button type="button" className="text-button" onClick={() => setForm(DEFAULT_FORM)}>
              Reset example
            </button>
          </div>

          <form onSubmit={handleCalculate} noValidate>
            <label className="field-group">
              <span>Venue slug</span>
              <input
                data-test-id="venueSlug"
                value={form.venueSlug}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setField("venueSlug", event.target.value)}
                aria-invalid={Boolean(fieldErrors.venueSlug)}
                aria-describedby={fieldErrors.venueSlug ? "venueSlug-error" : undefined}
                autoComplete="off"
                spellCheck={false}
              />
              {fieldErrors.venueSlug && <small id="venueSlug-error" className="field-error">{fieldErrors.venueSlug}</small>}
            </label>

            <label className="field-group">
              <span>Cart value</span>
              <div className="money-input">
                <span aria-hidden="true">€</span>
                <input
                  data-test-id="cartValue"
                  inputMode="decimal"
                  value={form.cartValue}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setField("cartValue", event.target.value)}
                  aria-invalid={Boolean(fieldErrors.cartValue)}
                  aria-describedby={fieldErrors.cartValue ? "cartValue-error" : "cartValue-help"}
                />
              </div>
              <small id="cartValue-help" className="field-help">Decimal comma or point both work.</small>
              {fieldErrors.cartValue && <small id="cartValue-error" className="field-error">{fieldErrors.cartValue}</small>}
            </label>

            <fieldset className="location-fieldset">
              <legend>Customer location</legend>
              <div className="coordinate-grid">
                <label className="field-group">
                  <span>Latitude</span>
                  <input
                    data-test-id="userLatitude"
                    inputMode="decimal"
                    value={form.latitude}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setField("latitude", event.target.value)}
                    aria-invalid={Boolean(fieldErrors.latitude)}
                    aria-describedby={fieldErrors.latitude ? "latitude-error" : undefined}
                  />
                  {fieldErrors.latitude && <small id="latitude-error" className="field-error">{fieldErrors.latitude}</small>}
                </label>
                <label className="field-group">
                  <span>Longitude</span>
                  <input
                    data-test-id="userLongitude"
                    inputMode="decimal"
                    value={form.longitude}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setField("longitude", event.target.value)}
                    aria-invalid={Boolean(fieldErrors.longitude)}
                    aria-describedby={fieldErrors.longitude ? "longitude-error" : undefined}
                  />
                  {fieldErrors.longitude && <small id="longitude-error" className="field-error">{fieldErrors.longitude}</small>}
                </label>
              </div>

              <div className="location-actions">
                <button
                  data-test-id="getLocation"
                  type="button"
                  className="secondary-button"
                  onClick={handleLocation}
                  disabled={isLocating}
                >
                  {isLocating ? "Locating…" : "Use my location"}
                </button>
                <div className="preset-row" aria-label="Helsinki location presets">
                  {LOCATION_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      className="preset-button"
                      onClick={() => usePreset(preset.latitude, preset.longitude)}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </fieldset>

            {requestError && (
              <div className="error-banner" role="alert">
                <strong>Quote unavailable</strong>
                <span>{requestError}</span>
              </div>
            )}

            <button
              data-test-id="calculateDeliveryPrice"
              className="primary-button"
              type="submit"
              disabled={isLoading}
            >
              <span>{isLoading ? "Reading venue rules…" : "Calculate delivery quote"}</span>
              <span aria-hidden="true">→</span>
            </button>
          </form>
        </section>

        <aside className="context-card" aria-label="How Radius calculates the quote">
          <span className="eyebrow">Pricing contract</span>
          <h2>Three inputs become one inspectable total.</h2>
          <div className="formula-stack">
            <div><span>01</span><p><strong>Cart</strong><small>Your basket in integer cents.</small></p></div>
            <div><span>02</span><p><strong>Distance</strong><small>Haversine distance from customer to venue.</small></p></div>
            <div><span>03</span><p><strong>Venue rules</strong><small>Base fee, distance range and small-order threshold.</small></p></div>
          </div>
          <div className="architecture-note">
            <span>Boundary design</span>
            <p>API payloads are validated before they enter the pricing domain. UI state never owns pricing rules.</p>
          </div>
        </aside>
      </div>

      {quote && <QuoteResult quote={quote} />}
      <RecentQuotes quotes={recentQuotes} />

      <footer className="page-footer">
        <span>Radius</span>
        <p>Home-assignment API data · client-side price calculation · precise coordinates are not stored.</p>
      </footer>
    </main>
  );
}
