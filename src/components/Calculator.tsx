import { useEffect, useMemo, useState, type FormEvent } from "react";
import QuoteResult from "./QuoteResult";
import ProviderDirectory from "./ProviderDirectory";
import {
  calculateQuotes,
  parsePositiveNumber,
  TARIFF_SNAPSHOT_DATE,
  type Audience,
  type ParcelInput,
  type RouteScope,
} from "../domain/finlandTariffs";
import { COPY, type Lang } from "../i18n";

interface FormState {
  route: RouteScope;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  audience: Audience;
  glsPickup: boolean;
  glsHomeDelivery: boolean;
  destinationPostalCode: string;
}

const DEFAULT_FORM: FormState = {
  route: "mainland",
  weightKg: "1",
  lengthCm: "25",
  widthCm: "15",
  heightCm: "5",
  audience: "consumer",
  glsPickup: false,
  glsHomeDelivery: false,
  destinationPostalCode: "",
};

const PARCEL_PRESETS = [
  { weightKg: "1", lengthCm: "25", widthCm: "15", heightCm: "5" },
  { weightKg: "3", lengthCm: "40", widthCm: "30", heightCm: "20" },
  { weightKg: "8", lengthCm: "60", widthCm: "40", heightCm: "35" },
] as const;

type Errors = Partial<Record<keyof FormState, string>>;

function initialLanguage(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem("pakettitutka-lang");
  if (stored === "fi" || stored === "en") return stored;
  return window.navigator.language.toLowerCase().startsWith("fi") ? "fi" : "en";
}

export default function Calculator() {
  const [lang, setLang] = useState<Lang>(initialLanguage);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitted, setSubmitted] = useState<ParcelInput | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const c = COPY[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem("pakettitutka-lang", lang);
  }, [lang]);

  const quotes = useMemo(() => (submitted ? calculateQuotes(submitted) : []), [submitted]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (next.audience !== "consumer" || next.route !== "mainland") {
        next.glsPickup = false;
        next.glsHomeDelivery = false;
      }

      if (next.audience !== "business" || next.route !== "mainland") {
        next.destinationPostalCode = "";
      }

      return next;
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitted(null);
  };

  const applyPreset = (preset: (typeof PARCEL_PRESETS)[number]) => {
    setForm((current) => ({
      ...current,
      weightKg: preset.weightKg,
      lengthCm: preset.lengthCm,
      widthCm: preset.widthCm,
      heightCm: preset.heightCm,
    }));
    setErrors({});
    setSubmitted(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Errors = {};

    const weightKg = parsePositiveNumber(form.weightKg);
    const lengthCm = parsePositiveNumber(form.lengthCm);
    const widthCm = parsePositiveNumber(form.widthCm);
    const heightCm = parsePositiveNumber(form.heightCm);

    if (weightKg === null) nextErrors.weightKg = c.form.errors.positiveWeight;
    if (lengthCm === null) nextErrors.lengthCm = c.form.errors.positiveLength;
    if (widthCm === null) nextErrors.widthCm = c.form.errors.positiveWidth;
    if (heightCm === null) nextErrors.heightCm = c.form.errors.positiveHeight;
    if (
      form.audience === "business" &&
      form.route === "mainland" &&
      form.destinationPostalCode.trim() !== "" &&
      !/^\d{5}$/.test(form.destinationPostalCode.trim())
    ) {
      nextErrors.destinationPostalCode = c.form.errors.postcode;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !weightKg || !lengthCm || !widthCm || !heightCm) return;

    setSubmitted({
      route: form.route,
      weightKg,
      lengthCm,
      widthCm,
      heightCm,
      audience: form.audience,
      glsPickup: form.glsPickup,
      glsHomeDelivery: form.glsHomeDelivery,
      destinationPostalCode:
        form.audience === "business" && form.route === "mainland"
          ? form.destinationPostalCode.trim() || undefined
          : undefined,
    });
  };

  const reset = () => {
    setForm(DEFAULT_FORM);
    setSubmitted(null);
    setErrors({});
  };

  return (
    <main className="app-shell">
      <a className="skip-link" href="#shipment">{c.skip}</a>

      <header className="site-header" aria-label="Pakettitutka navigation">
        <a className="brand-lockup" href="#" aria-label="Pakettitutka">
          <img src="/brand/logos/logo-primary-v2.webp" alt="Pakettitutka" width="220" height="82" />
        </a>

        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#shipment">{c.nav.compare}</a>
          <a href="#method">{c.nav.method}</a>
          <a href="#providers">{c.nav.carriers}</a>
        </nav>

        <div className="language-switch" role="group" aria-label={c.lang.label}>
          {(["fi", "en"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={lang === value ? "language-option active" : "language-option"}
              aria-pressed={lang === value}
              onClick={() => setLang(value)}
            >
              {c.lang[value]}
            </button>
          ))}
        </div>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow">{c.hero.eyebrow}</span>
          <h1 id="hero-title">{c.hero.title}</h1>
          <p>{c.hero.body}</p>
          <div className="hero-actions">
            <a className="hero-primary" href="#shipment">{c.hero.primary} <span aria-hidden="true">↓</span></a>
            <a className="hero-secondary" href="#method">{c.hero.secondary}</a>
          </div>
          <div className="trust-row" aria-label="Trust signals">
            {c.hero.trust.map((item) => <span key={item}>{item}</span>)}
            <span>Snapshot {TARIFF_SNAPSHOT_DATE}</span>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-visual-glow" />
          <img
            src="/brand/visuals/hero-finland.webp"
            alt=""
            width="1100"
            height="1100"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="hero-float hero-float--top">
            <span>{c.hero.scope}</span>
            <strong>{c.hero.scopeValue}</strong>
          </div>
          <div className="hero-float hero-float--bottom">
            <span>{c.hero.model}</span>
            <strong>{c.hero.modelValue}</strong>
          </div>
        </div>
      </section>

      <section className="workspace-grid" id="shipment" aria-label="Shipment calculator">
        <div className="calculator-column">
          <div className="composer-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">{c.form.eyebrow}</span>
                <h2>{c.form.title}</h2>
              </div>
              <button className="text-button" type="button" onClick={reset}>{c.form.reset}</button>
            </div>

            <form onSubmit={submit} noValidate>
              <div>
                <span className="control-label">{c.form.pricingMode}</span>
                <div className="audience-switch" role="group" aria-label={c.form.pricingMode}>
                  <button
                    type="button"
                    className={form.audience === "consumer" ? "segment active" : "segment"}
                    onClick={() => update("audience", "consumer")}
                    aria-pressed={form.audience === "consumer"}
                  >
                    {c.form.public}
                  </button>
                  <button
                    type="button"
                    className={form.audience === "business" ? "segment active" : "segment"}
                    onClick={() => update("audience", "business")}
                    aria-pressed={form.audience === "business"}
                  >
                    {c.form.business}
                  </button>
                </div>
                <p className="field-help desktop-detail">{c.form.pricingHelp}</p>
              </div>

              <div>
                <span className="control-label">{c.form.route}</span>
                <div className="route-switch" role="group" aria-label={c.form.route}>
                  <button
                    type="button"
                    className={form.route === "mainland" ? "route-option active" : "route-option"}
                    onClick={() => update("route", "mainland")}
                    aria-pressed={form.route === "mainland"}
                  >
                    <strong>{c.form.mainland}</strong>
                    <small>{c.form.mainlandHint}</small>
                  </button>
                  <button
                    type="button"
                    className={form.route === "aland" ? "route-option active" : "route-option"}
                    onClick={() => update("route", "aland")}
                    aria-pressed={form.route === "aland"}
                  >
                    <strong>{c.form.aland}</strong>
                    <small>{c.form.alandHint}</small>
                  </button>
                </div>
                <p className="field-help desktop-detail">{c.form.routeHelp}</p>
              </div>

              {form.audience === "business" && form.route === "mainland" && (
                <label className="field-group">
                  <span>{c.form.destination}</span>
                  <input
                    data-test-id="destinationPostalCode"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={5}
                    placeholder="00100"
                    value={form.destinationPostalCode}
                    onChange={(e) => update("destinationPostalCode", e.target.value)}
                    aria-invalid={Boolean(errors.destinationPostalCode)}
                  />
                  {errors.destinationPostalCode && <small className="field-error">{errors.destinationPostalCode}</small>}
                  <small className="field-help">{c.form.destinationHint}</small>
                </label>
              )}

              <div className="preset-block">
                <div className="preset-heading">
                  <span className="control-label">{c.form.presets}</span>
                  <small>{c.form.presetsHint}</small>
                </div>
                <div className="preset-row">
                  {PARCEL_PRESETS.map((preset, index) => (
                    <button className="preset-button" type="button" key={preset.lengthCm} onClick={() => applyPreset(preset)}>
                      <strong>{c.presets[index].label}</strong>
                      <span>{c.presets[index].hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="measurement-grid">
                <label className="field-group weight-field">
                  <span>{c.form.weight} · kg</span>
                  <input
                    data-test-id="weightKg"
                    inputMode="decimal"
                    value={form.weightKg}
                    onChange={(e) => update("weightKg", e.target.value)}
                    aria-invalid={Boolean(errors.weightKg)}
                  />
                  {errors.weightKg && <small className="field-error">{errors.weightKg}</small>}
                </label>

                <fieldset className="dimension-fieldset">
                  <legend>{c.form.dimensions} · cm</legend>
                  <div className="dimension-grid">
                    <label className="dimension-field">
                      <span>L</span>
                      <input
                        data-test-id="lengthCm"
                        inputMode="decimal"
                        aria-label={c.form.length}
                        value={form.lengthCm}
                        onChange={(e) => update("lengthCm", e.target.value)}
                        aria-invalid={Boolean(errors.lengthCm)}
                      />
                    </label>
                    <span className="dimension-times" aria-hidden="true">×</span>
                    <label className="dimension-field">
                      <span>W</span>
                      <input
                        data-test-id="widthCm"
                        inputMode="decimal"
                        aria-label={c.form.width}
                        value={form.widthCm}
                        onChange={(e) => update("widthCm", e.target.value)}
                        aria-invalid={Boolean(errors.widthCm)}
                      />
                    </label>
                    <span className="dimension-times" aria-hidden="true">×</span>
                    <label className="dimension-field">
                      <span>H</span>
                      <input
                        data-test-id="heightCm"
                        inputMode="decimal"
                        aria-label={c.form.height}
                        value={form.heightCm}
                        onChange={(e) => update("heightCm", e.target.value)}
                        aria-invalid={Boolean(errors.heightCm)}
                      />
                    </label>
                  </div>
                  {(errors.lengthCm || errors.widthCm || errors.heightCm) && (
                    <small className="field-error">
                      {errors.lengthCm || errors.widthCm || errors.heightCm}
                    </small>
                  )}
                </fieldset>
              </div>
              <p className="field-help field-help--compact desktop-detail">{c.form.measureHelp}</p>

              {form.audience === "consumer" && form.route === "mainland" && (
                <details className="provider-options">
                  <summary>
                    <span>{c.form.gls}</span>
                    <small>{c.form.glsHint}</small>
                  </summary>
                  <label className="check-row">
                    <input type="checkbox" checked={form.glsPickup} onChange={(e) => update("glsPickup", e.target.checked)} />
                    <span><strong>{c.form.pickup}</strong><small>{c.form.pickupHint}</small></span>
                  </label>
                  <label className="check-row">
                    <input type="checkbox" checked={form.glsHomeDelivery} onChange={(e) => update("glsHomeDelivery", e.target.checked)} />
                    <span><strong>{c.form.home}</strong><small>{c.form.homeHint}</small></span>
                  </label>
                </details>
              )}

              <button data-test-id="comparePrices" className="primary-button" type="submit">
                <span>{c.form.compare}</span><span aria-hidden="true">→</span>
              </button>
            </form>
          </div>

          {submitted && <QuoteResult input={submitted} quotes={quotes} lang={lang} />}
        </div>

        <aside className="context-card" id="method">
          <img className="context-radar" src="/brand/visuals/background-radar.webp" alt="" aria-hidden="true" />
          <div className="context-content">
            <span className="eyebrow">{c.method.eyebrow}</span>
            <h2>{c.method.title}</h2>
            <div className="formula-stack">
              {c.method.steps.map(([title, body], index) => (
                <div key={title}>
                  <span>0{index + 1}</span>
                  <p><strong>{title}</strong><small>{body}</small></p>
                </div>
              ))}
            </div>
            <div className="architecture-note">
              <span>{c.method.important}</span>
              <p>{c.method.note}</p>
            </div>
          </div>
        </aside>
      </section>

      <ProviderDirectory lang={lang} />

      <footer className="page-footer">
        <div className="footer-brand">
          <img src="/brand/logos/logo-icon-v2.webp" alt="" aria-hidden="true" width="180" height="68" />
          <strong>Pakettitutka</strong>
        </div>
        <p>{c.footer}</p>
      </footer>
    </main>
  );
}
