import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import QuoteResult from "./QuoteResult";
import {
  calculateDeliveryEstimate,
  isCurrencyCodeValid,
  parseCurrencyAmount,
  parseRoadFactor,
  type PricingModel,
  type ServiceLevel,
} from "../domain/delivery";
import { calculateDistance } from "../domain/geo";
import {
  GeocodingError,
  searchPlaces,
  type PlaceMatch,
} from "../services/geocoder";

interface FormState {
  fromQuery: string;
  toQuery: string;
  serviceLevel: ServiceLevel;
  currency: string;
  baseFee: string;
  perKilometer: string;
  minimumFee: string;
  roadFactor: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

interface ResolvedRoute {
  pickupMatches: PlaceMatch[];
  dropoffMatches: PlaceMatch[];
  pickupIndex: number;
  dropoffIndex: number;
}

const DEFAULT_FORM: FormState = {
  fromQuery: "",
  toQuery: "",
  serviceLevel: "standard",
  currency: "EUR",
  baseFee: "3.90",
  perKilometer: "0.85",
  minimumFee: "4.90",
  roadFactor: "1.25",
};

const ROUTE_EXAMPLES = [
  { label: "Turku → Helsinki", from: "Turku, Finland", to: "Helsinki Airport, Finland" },
  { label: "Berlin → Potsdam", from: "Berlin, Germany", to: "Potsdam, Germany" },
  { label: "Manhattan → JFK", from: "Manhattan, New York", to: "JFK Airport, New York" },
  { label: "Tokyo → Haneda", from: "Tokyo Station, Japan", to: "Haneda Airport, Japan" },
];

function validateQuery(value: string): string | undefined {
  const length = value.trim().length;
  if (length < 2) return "Enter a place, address, landmark, city, or postal code.";
  if (length > 160) return "Keep the place description under 160 characters.";
  return undefined;
}

function buildPricingModel(form: FormState): {
  model: PricingModel | null;
  errors: FieldErrors;
} {
  const errors: FieldErrors = {};
  const currency = form.currency.trim().toUpperCase();

  if (!isCurrencyCodeValid(currency)) {
    errors.currency = "Use a valid 3-letter currency code, for example EUR, USD, GBP, or JPY.";
    return { model: null, errors };
  }

  const baseFeeMinor = parseCurrencyAmount(form.baseFee, currency);
  const perKilometerMinor = parseCurrencyAmount(form.perKilometer, currency);
  const minimumFeeMinor = parseCurrencyAmount(form.minimumFee, currency);
  const roadFactor = parseRoadFactor(form.roadFactor);

  if (baseFeeMinor === null) errors.baseFee = "Enter a valid base fee.";
  if (perKilometerMinor === null) errors.perKilometer = "Enter a valid per-kilometre rate.";
  if (minimumFeeMinor === null) errors.minimumFee = "Enter a valid minimum fee.";
  if (roadFactor === null) errors.roadFactor = "Use a road factor between 1.00 and 3.00.";

  if (
    baseFeeMinor === null ||
    perKilometerMinor === null ||
    minimumFeeMinor === null ||
    roadFactor === null
  ) {
    return { model: null, errors };
  }

  return {
    model: {
      currency,
      baseFeeMinor,
      perKilometerMinor,
      minimumFeeMinor,
      roadFactor,
    },
    errors,
  };
}

export default function Calculator() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState("");
  const [resolvedRoute, setResolvedRoute] = useState<ResolvedRoute | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const pricingState = useMemo(() => buildPricingModel(form), [form]);

  const selectedPickup = resolvedRoute
    ? resolvedRoute.pickupMatches[resolvedRoute.pickupIndex]
    : null;
  const selectedDropoff = resolvedRoute
    ? resolvedRoute.dropoffMatches[resolvedRoute.dropoffIndex]
    : null;

  const estimate = useMemo(() => {
    if (!selectedPickup || !selectedDropoff || !pricingState.model) return null;

    const straightLineMeters = calculateDistance(
      selectedPickup.coordinates,
      selectedDropoff.coordinates,
    );
    const international =
      Boolean(selectedPickup.countryCode) &&
      Boolean(selectedDropoff.countryCode) &&
      selectedPickup.countryCode !== selectedDropoff.countryCode;

    return calculateDeliveryEstimate(
      straightLineMeters,
      pricingState.model,
      form.serviceLevel,
      international,
    );
  }, [form.serviceLevel, pricingState.model, selectedDropoff, selectedPickup]);

  const setField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setRequestError("");

    if (field === "fromQuery" || field === "toQuery") {
      abortRef.current?.abort();
      setResolvedRoute(null);
      setIsLoading(false);
    }
  };

  const applyExample = (from: string, to: string) => {
    abortRef.current?.abort();
    setForm((current) => ({ ...current, fromQuery: from, toQuery: to }));
    setFieldErrors((current) => ({
      ...current,
      fromQuery: undefined,
      toQuery: undefined,
    }));
    setRequestError("");
    setResolvedRoute(null);
    setIsLoading(false);
  };

  const swapRoute = () => {
    setForm((current) => ({
      ...current,
      fromQuery: current.toQuery,
      toQuery: current.fromQuery,
    }));

    setResolvedRoute((current) =>
      current
        ? {
            pickupMatches: current.dropoffMatches,
            dropoffMatches: current.pickupMatches,
            pickupIndex: current.dropoffIndex,
            dropoffIndex: current.pickupIndex,
          }
        : null,
    );
  };

  const reset = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setForm(DEFAULT_FORM);
    setFieldErrors({});
    setRequestError("");
    setResolvedRoute(null);
    setIsLoading(false);
  };

  const handlePlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FieldErrors = {
      fromQuery: validateQuery(form.fromQuery),
      toQuery: validateQuery(form.toQuery),
      ...pricingState.errors,
    };
    const compactErrors = Object.fromEntries(
      Object.entries(nextErrors).filter(([, value]) => Boolean(value)),
    ) as FieldErrors;

    setFieldErrors(compactErrors);
    setRequestError("");

    if (Object.keys(compactErrors).length > 0 || !pricingState.model) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setResolvedRoute(null);
    setIsLoading(true);

    try {
      const [pickupMatches, dropoffMatches] = await Promise.all([
        searchPlaces(form.fromQuery, controller.signal),
        searchPlaces(form.toQuery, controller.signal),
      ]);

      setResolvedRoute({
        pickupMatches,
        dropoffMatches,
        pickupIndex: 0,
        dropoffIndex: 0,
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      setRequestError(
        error instanceof GeocodingError
          ? error.message
          : "The route could not be resolved. Try again in a moment.",
      );
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
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
          <span className="eyebrow">Radius · Global delivery planner</span>
          <h1>From any place to any place — without coordinates.</h1>
          <p>
            Search addresses, landmarks, cities, or postal codes worldwide. Radius resolves the
            places, models road distance, and applies a transparent pricing model locally.
          </p>
          <div className="trust-row" aria-label="Product principles">
            <span>No GPS entry</span>
            <span>No venue slug</span>
            <span>Global place search</span>
            <span>Local calculation</span>
          </div>
        </div>
      </header>

      <div className="workspace-grid">
        <section className="composer-card" aria-labelledby="planner-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Plan a delivery</span>
              <h2 id="planner-title">Route</h2>
            </div>
            <button type="button" className="text-button" onClick={reset}>
              Clear
            </button>
          </div>

          <form onSubmit={handlePlan} noValidate>
            <div className="route-input-stack">
              <label className="field-group route-field">
                <span>From</span>
                <div className="route-input-shell">
                  <span className="route-dot route-dot--from" aria-hidden="true" />
                  <input
                    data-test-id="fromQuery"
                    value={form.fromQuery}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setField("fromQuery", event.target.value)
                    }
                    placeholder="Turku railway station, Finland"
                    aria-invalid={Boolean(fieldErrors.fromQuery)}
                    aria-describedby={fieldErrors.fromQuery ? "from-error" : undefined}
                    autoComplete="off"
                  />
                </div>
                {fieldErrors.fromQuery && (
                  <small id="from-error" className="field-error">
                    {fieldErrors.fromQuery}
                  </small>
                )}
              </label>

              <button
                className="swap-button"
                type="button"
                onClick={swapRoute}
                aria-label="Swap pickup and drop-off"
              >
                ⇅
              </button>

              <label className="field-group route-field">
                <span>To</span>
                <div className="route-input-shell">
                  <span className="route-dot route-dot--to" aria-hidden="true" />
                  <input
                    data-test-id="toQuery"
                    value={form.toQuery}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setField("toQuery", event.target.value)
                    }
                    placeholder="Helsinki Airport, Finland"
                    aria-invalid={Boolean(fieldErrors.toQuery)}
                    aria-describedby={fieldErrors.toQuery ? "to-error" : undefined}
                    autoComplete="off"
                  />
                </div>
                {fieldErrors.toQuery && (
                  <small id="to-error" className="field-error">
                    {fieldErrors.toQuery}
                  </small>
                )}
              </label>
            </div>

            <div className="example-row" aria-label="Route examples">
              {ROUTE_EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  className="preset-button"
                  onClick={() => applyExample(example.from, example.to)}
                >
                  {example.label}
                </button>
              ))}
            </div>

            <div className="quick-settings">
              <label className="field-group">
                <span>Service</span>
                <select
                  data-test-id="serviceLevel"
                  value={form.serviceLevel}
                  onChange={(event) =>
                    setField("serviceLevel", event.target.value as ServiceLevel)
                  }
                >
                  <option value="economy">Economy</option>
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                </select>
              </label>

              <label className="field-group">
                <span>Currency</span>
                <input
                  data-test-id="currency"
                  className="currency-input"
                  value={form.currency}
                  onChange={(event) => setField("currency", event.target.value.toUpperCase())}
                  maxLength={3}
                  inputMode="text"
                  autoCapitalize="characters"
                  aria-invalid={Boolean(fieldErrors.currency)}
                  aria-describedby={fieldErrors.currency ? "currency-error" : undefined}
                />
                {fieldErrors.currency && (
                  <small id="currency-error" className="field-error">
                    {fieldErrors.currency}
                  </small>
                )}
              </label>
            </div>

            <details className="pricing-details">
              <summary>
                <span>Pricing model</span>
                <small>Optional · make it match your market</small>
              </summary>
              <div className="pricing-grid">
                <label className="field-group">
                  <span>Base fee</span>
                  <input
                    value={form.baseFee}
                    inputMode="decimal"
                    onChange={(event) => setField("baseFee", event.target.value)}
                    aria-invalid={Boolean(fieldErrors.baseFee)}
                  />
                  {fieldErrors.baseFee && <small className="field-error">{fieldErrors.baseFee}</small>}
                </label>
                <label className="field-group">
                  <span>Per km</span>
                  <input
                    value={form.perKilometer}
                    inputMode="decimal"
                    onChange={(event) => setField("perKilometer", event.target.value)}
                    aria-invalid={Boolean(fieldErrors.perKilometer)}
                  />
                  {fieldErrors.perKilometer && (
                    <small className="field-error">{fieldErrors.perKilometer}</small>
                  )}
                </label>
                <label className="field-group">
                  <span>Minimum fee</span>
                  <input
                    value={form.minimumFee}
                    inputMode="decimal"
                    onChange={(event) => setField("minimumFee", event.target.value)}
                    aria-invalid={Boolean(fieldErrors.minimumFee)}
                  />
                  {fieldErrors.minimumFee && (
                    <small className="field-error">{fieldErrors.minimumFee}</small>
                  )}
                </label>
                <label className="field-group">
                  <span>Road factor</span>
                  <input
                    value={form.roadFactor}
                    inputMode="decimal"
                    onChange={(event) => setField("roadFactor", event.target.value)}
                    aria-invalid={Boolean(fieldErrors.roadFactor)}
                  />
                  {fieldErrors.roadFactor && (
                    <small className="field-error">{fieldErrors.roadFactor}</small>
                  )}
                </label>
              </div>
              <p className="model-help">
                Road factor converts straight-line distance into a planning road estimate. 1.25 means
                roughly 25% longer than the air distance.
              </p>
            </details>

            {requestError && (
              <div className="error-banner" role="alert">
                <strong>Couldn’t resolve this route</strong>
                <span>{requestError}</span>
              </div>
            )}

            <button
              data-test-id="planDelivery"
              className="primary-button"
              type="submit"
              disabled={isLoading}
            >
              <span>{isLoading ? "Finding both places…" : "Plan delivery"}</span>
              <span aria-hidden="true">→</span>
            </button>
          </form>
        </section>

        <aside className="context-card" aria-label="How Radius works">
          <span className="eyebrow">No hidden provider rules</span>
          <h2>Search globally. Price locally.</h2>
          <div className="formula-stack">
            <div>
              <span>01</span>
              <p>
                <strong>Resolve the places</strong>
                <small>Names, addresses, landmarks, cities, or postal codes.</small>
              </p>
            </div>
            <div>
              <span>02</span>
              <p>
                <strong>Model road distance</strong>
                <small>Haversine distance × your road factor.</small>
              </p>
            </div>
            <div>
              <span>03</span>
              <p>
                <strong>Apply your pricing</strong>
                <small>Base fee + distance rate + service level.</small>
              </p>
            </div>
          </div>
          <div className="architecture-note">
            <span>Reliability boundary</span>
            <p>
              Photon searches addresses first. Open-Meteo provides a city/postal-code fallback.
              Pricing never depends on either service.
            </p>
          </div>
        </aside>
      </div>

      {resolvedRoute && estimate && pricingState.model && selectedPickup && selectedDropoff && (
        <QuoteResult
          estimate={estimate}
          model={pricingState.model}
          pickupMatches={resolvedRoute.pickupMatches}
          dropoffMatches={resolvedRoute.dropoffMatches}
          pickupIndex={resolvedRoute.pickupIndex}
          dropoffIndex={resolvedRoute.dropoffIndex}
          onPickupChange={(pickupIndex) =>
            setResolvedRoute((current) => (current ? { ...current, pickupIndex } : current))
          }
          onDropoffChange={(dropoffIndex) =>
            setResolvedRoute((current) => (current ? { ...current, dropoffIndex } : current))
          }
        />
      )}

      <footer className="page-footer">
        <span>Radius</span>
        <p>
          Place search: Photon / OpenStreetMap, with Open-Meteo locality fallback. Planning estimates,
          not carrier checkout prices.
        </p>
      </footer>
    </main>
  );
}
