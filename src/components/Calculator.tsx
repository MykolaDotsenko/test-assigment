import { useMemo, useState, type FormEvent } from "react";
import QuoteResult from "./QuoteResult";
import ProviderDirectory from "./ProviderDirectory";
import {
  calculateQuotes,
  isFinnishPostalCode,
  parsePositiveNumber,
  TARIFF_SNAPSHOT_DATE,
  type Audience,
  type ParcelInput,
} from "../domain/finlandTariffs";

interface FormState {
  fromPostalCode: string;
  toPostalCode: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  audience: Audience;
  glsPickup: boolean;
  glsHomeDelivery: boolean;
}

const DEFAULT_FORM: FormState = {
  fromPostalCode: "20100",
  toPostalCode: "00100",
  weightKg: "1",
  lengthCm: "20",
  widthCm: "15",
  heightCm: "5",
  audience: "consumer",
  glsPickup: false,
  glsHomeDelivery: false,
};

type Errors = Partial<Record<keyof FormState, string>>;

export default function Calculator() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitted, setSubmitted] = useState<ParcelInput | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  const quotes = useMemo(() => (submitted ? calculateQuotes(submitted) : []), [submitted]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitted(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Errors = {};

    if (!isFinnishPostalCode(form.fromPostalCode)) nextErrors.fromPostalCode = "Use a 5-digit Finnish postal code.";
    if (!isFinnishPostalCode(form.toPostalCode)) nextErrors.toPostalCode = "Use a 5-digit Finnish postal code.";

    const weightKg = parsePositiveNumber(form.weightKg);
    const lengthCm = parsePositiveNumber(form.lengthCm);
    const widthCm = parsePositiveNumber(form.widthCm);
    const heightCm = parsePositiveNumber(form.heightCm);

    if (weightKg === null) nextErrors.weightKg = "Enter a positive weight.";
    if (lengthCm === null) nextErrors.lengthCm = "Enter a positive length.";
    if (widthCm === null) nextErrors.widthCm = "Enter a positive width.";
    if (heightCm === null) nextErrors.heightCm = "Enter a positive height.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !weightKg || !lengthCm || !widthCm || !heightCm) return;

    setSubmitted({
      fromPostalCode: form.fromPostalCode.trim(),
      toPostalCode: form.toPostalCode.trim(),
      weightKg,
      lengthCm,
      widthCm,
      heightCm,
      audience: form.audience,
      glsPickup: form.glsPickup,
      glsHomeDelivery: form.glsHomeDelivery,
    });
  };

  return (
    <main className="app-shell">
      <a className="skip-link" href="#shipment">Skip to shipment calculator</a>

      <header className="site-header" aria-label="Pakettitutka navigation">
        <a className="brand-lockup" href="#" aria-label="Pakettitutka home">
          <img src="/brand/logos/logo-primary-v2.webp" alt="Pakettitutka" width="220" height="82" />
        </a>
        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#shipment">Compare</a>
          <a href="#method">Method</a>
          <a href="#providers">Carriers</a>
        </nav>
        <span className="market-chip">Finland · tariff-backed</span>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow">Pakettitutka · Finnish parcel intelligence</span>
          <h1 id="hero-title">Compare parcel prices across Finland without guessing.</h1>
          <p>
            Enter two postal codes, weight and dimensions. Pakettitutka applies verified Finnish carrier
            rules and labels every result by pricing confidence: public tariff, contract list rate,
            live quote, or inactive service.
          </p>
          <div className="hero-actions">
            <a className="hero-primary" href="#shipment">Compare a parcel <span aria-hidden="true">↓</span></a>
            <a className="hero-secondary" href="#method">See the pricing method</a>
          </div>
          <div className="trust-row" aria-label="Pricing trust signals">
            <span>Official tariff sources</span>
            <span>Dimensions + volumetric weight</span>
            <span>Fuel + VAT where published</span>
            <span>Snapshot {TARIFF_SNAPSHOT_DATE}</span>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-visual-glow" />
          <img src="/brand/visuals/hero-finland.webp" alt="" width="1100" height="1100" />
          <div className="hero-float hero-float--top">
            <span>Tariff scope</span>
            <strong>Finland-first</strong>
          </div>
          <div className="hero-float hero-float--bottom">
            <span>Pricing model</span>
            <strong>Rules, not averages</strong>
          </div>
        </div>
      </section>

      <section className="workspace-grid" id="shipment" aria-label="Shipment calculator">
        <div className="composer-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Shipment</span>
              <h2>What are you sending?</h2>
            </div>
            <button className="text-button" type="button" onClick={() => { setForm(DEFAULT_FORM); setSubmitted(null); setErrors({}); }}>
              Reset example
            </button>
          </div>

          <form onSubmit={submit} noValidate>
            <div className="audience-switch" role="group" aria-label="Pricing audience">
              <button
                type="button"
                className={form.audience === "consumer" ? "segment active" : "segment"}
                onClick={() => update("audience", "consumer")}
                aria-pressed={form.audience === "consumer"}
              >
                Private sender
              </button>
              <button
                type="button"
                className={form.audience === "business" ? "segment active" : "segment"}
                onClick={() => update("audience", "business")}
                aria-pressed={form.audience === "business"}
              >
                Business / list rates
              </button>
            </div>

            <div className="postal-grid">
              <label className="field-group">
                <span>From postal code</span>
                <input data-test-id="fromPostalCode" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={form.fromPostalCode} onChange={(e) => update("fromPostalCode", e.target.value)} aria-invalid={Boolean(errors.fromPostalCode)} />
                {errors.fromPostalCode && <small className="field-error">{errors.fromPostalCode}</small>}
              </label>
              <label className="field-group">
                <span>To postal code</span>
                <input data-test-id="toPostalCode" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={form.toPostalCode} onChange={(e) => update("toPostalCode", e.target.value)} aria-invalid={Boolean(errors.toPostalCode)} />
                {errors.toPostalCode && <small className="field-error">{errors.toPostalCode}</small>}
              </label>
            </div>

            <div className="parcel-grid">
              <label className="field-group">
                <span>Weight · kg</span>
                <input data-test-id="weightKg" inputMode="decimal" value={form.weightKg} onChange={(e) => update("weightKg", e.target.value)} aria-invalid={Boolean(errors.weightKg)} />
                {errors.weightKg && <small className="field-error">{errors.weightKg}</small>}
              </label>
              <label className="field-group">
                <span>Length · cm</span>
                <input data-test-id="lengthCm" inputMode="decimal" value={form.lengthCm} onChange={(e) => update("lengthCm", e.target.value)} aria-invalid={Boolean(errors.lengthCm)} />
                {errors.lengthCm && <small className="field-error">{errors.lengthCm}</small>}
              </label>
              <label className="field-group">
                <span>Width · cm</span>
                <input data-test-id="widthCm" inputMode="decimal" value={form.widthCm} onChange={(e) => update("widthCm", e.target.value)} aria-invalid={Boolean(errors.widthCm)} />
                {errors.widthCm && <small className="field-error">{errors.widthCm}</small>}
              </label>
              <label className="field-group">
                <span>Height · cm</span>
                <input data-test-id="heightCm" inputMode="decimal" value={form.heightCm} onChange={(e) => update("heightCm", e.target.value)} aria-invalid={Boolean(errors.heightCm)} />
                {errors.heightCm && <small className="field-error">{errors.heightCm}</small>}
              </label>
            </div>

            <details className="provider-options">
              <summary>
                <span>GLS options</span>
                <small>Only affect GLSparcel.fi quote</small>
              </summary>
              <label className="check-row">
                <input type="checkbox" checked={form.glsPickup} onChange={(e) => update("glsPickup", e.target.checked)} />
                <span><strong>Pickup from sender</strong><small>Official +€20 per shipment</small></span>
              </label>
              <label className="check-row">
                <input type="checkbox" checked={form.glsHomeDelivery} onChange={(e) => update("glsHomeDelivery", e.target.checked)} />
                <span><strong>Deliver to recipient’s door</strong><small>Official +€5 per parcel; mandatory above 15 kg</small></span>
              </label>
            </details>

            <button data-test-id="comparePrices" className="primary-button" type="submit">
              <span>Compare verified prices</span><span aria-hidden="true">→</span>
            </button>
          </form>
        </div>

        <aside className="context-card" id="method">
          <img className="context-radar" src="/brand/visuals/background-radar.webp" alt="" aria-hidden="true" />
          <div className="context-content">
            <span className="eyebrow">Accuracy first</span>
            <h2>No invented “average courier price”.</h2>
            <div className="formula-stack">
              <div><span>01</span><p><strong>Fit the parcel</strong><small>Carrier dimensions can rotate; girth rules are evaluated separately.</small></p></div>
              <div><span>02</span><p><strong>Apply tariff logic</strong><small>Flat size bands, weight bands or volumetric weight depending on carrier.</small></p></div>
              <div><span>03</span><p><strong>Add real surcharges</strong><small>Fuel and VAT are included only when an official rule is known.</small></p></div>
            </div>
            <div className="architecture-note">
              <span>Important</span>
              <p>Contract discounts, temporary promotions and account-specific pricing can beat published list rates. Pakettitutka never labels those as exact consumer prices.</p>
            </div>
          </div>
        </aside>
      </section>

      {submitted && <QuoteResult input={submitted} quotes={quotes} />}
      <ProviderDirectory />

      <footer className="page-footer">
        <div className="footer-brand">
          <img src="/brand/logos/logo-monochrome-v2.webp" alt="" aria-hidden="true" width="180" height="68" />
          <strong>Pakettitutka</strong>
        </div>
        <p>Independent comparison demo. Final carrier checkout or invoice remains authoritative.</p>
      </footer>
    </main>
  );
}
