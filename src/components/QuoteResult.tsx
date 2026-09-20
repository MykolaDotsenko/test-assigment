import { useEffect, useRef, useState } from "react";
import { formatPrice, type ParcelInput, type Quote } from "../domain/finlandTariffs";
import { COPY, type Lang } from "../i18n";
import {
  localizeQuoteDetail,
  quoteEffectiveDateLabel,
  quoteEtaLabel,
  quoteExplanationLabel,
  quoteServiceLabel,
  quoteSourceLabel,
} from "../quotePresentation";
import { copyTextWithFallback } from "../utils/copyText";

type CopyState = {
  id: string;
  status: "success" | "error";
} | null;

function badge(accuracy: Quote["accuracy"], lang: Lang) {
  const c = COPY[lang].results;
  if (accuracy === "exact-public") return c.publishedPublic;
  if (accuracy === "exact-list") return c.publishedList;
  if (accuracy === "inactive") return c.inactive;
  return c.liveQuote;
}

function coverageCopy(input: ParcelInput, lang: Lang) {
  if (lang === "fi") {
    if (input.audience === "business" && input.route === "aland") {
      return {
        title: "Ahvenanmaan yrityshinnat",
        body: "PostNordin Ahvenanmaan hintoja ei lasketa automaattisesti, koska saari- ja lauttalisät vaativat reittikohtaista käsittelyä.",
      };
    }
    if (input.audience === "business") {
      return {
        title: "Mitä vertailu kattaa",
        body: "Julkaistut PostNord-listahinnat lasketaan täällä. FedEx, UPS, DHL Express ja DSV jäävät tarjous- tai sopimushinnoiksi.",
      };
    }
    if (input.route === "aland") {
      return {
        title: "Ahvenanmaan kattavuus",
        body: "Posti lasketaan julkaistusta Ahvenanmaan hinnastosta. Matkahuollon Ahvenanmaan hinnoittelu vaatii erillisiä lisämaksuja, joten yhtä arvoa ei arvata.",
      };
    }
    return {
      title: "Mitä vertailu kattaa",
      body: "Pakettitutka laskee vain hinnat, jotka voidaan toistaa julkaistuista säännöistä. Reitti- tai sopimuskohtaiset hinnat avataan viralliseen tarjoukseen.",
    };
  }

  if (input.audience === "business" && input.route === "aland") {
    return {
      title: "Åland business coverage",
      body: "Pakettitutka does not auto-calculate PostNord for Åland because island/ferry surcharges require route-specific handling.",
    };
  }
  if (input.audience === "business") {
    return {
      title: "What this comparison covers",
      body: "Published PostNord list rates are calculated here. FedEx, UPS, DHL Express and DSV remain official live/account quotes.",
    };
  }
  if (input.route === "aland") {
    return {
      title: "Åland coverage",
      body: "Posti is calculated from its published Åland tariff. Matkahuolto uses route-specific pricing, so Pakettitutka does not invent a single total.",
    };
  }
  return {
    title: "What this comparison covers",
    body: "Pakettitutka calculates public tariffs it can reproduce from published rules. Dynamic or account-specific prices stay as official quote links.",
  };
}

function shipmentSummary(input: ParcelInput, quote: Quote, lang: Lang): string {
  const route =
    input.route === "aland"
      ? lang === "fi"
        ? "Manner-Suomi ↔ Ahvenanmaa"
        : "Mainland Finland ↔ Åland"
      : lang === "fi"
        ? "Manner-Suomi"
        : "Mainland Finland";

  return [
    "Pakettitutka",
    `${quote.provider} — ${quoteServiceLabel(quote, lang)}`,
    `${formatPrice(quote.priceCents)} · ${quoteEtaLabel(quote, lang)}`,
    `${input.weightKg} kg · ${input.lengthCm} × ${input.widthCm} × ${input.heightCm} cm`,
    route,
    input.destinationPostalCode
      ? `${lang === "fi" ? "Kohteen postinumero" : "Destination postcode"}: ${input.destinationPostalCode}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function QuoteResult({
  input,
  quotes,
  lang,
}: {
  input: ParcelInput;
  quotes: Quote[];
  lang: Lang;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [copyState, setCopyState] = useState<CopyState>(null);
  const c = COPY[lang].results;

  useEffect(() => {
    sectionRef.current?.focus();
  }, []);

  const copyQuote = async (quote: Quote) => {
    const text = shipmentSummary(input, quote, lang);
    const copied = await copyTextWithFallback(text);

    setCopyState({ id: quote.id, status: copied ? "success" : "error" });

    if (copied) {
      window.setTimeout(
        () => setCopyState((current) => (current?.id === quote.id ? null : current)),
        1800,
      );
    }
  };

  const secondPrice = quotes[1]?.priceCents ?? null;
  const bestPrice = quotes[0]?.priceCents ?? null;
  const savingsCents =
    bestPrice !== null && secondPrice !== null && secondPrice > bestPrice
      ? secondPrice - bestPrice
      : null;

  const routeLabel =
    input.route === "aland"
      ? c.aland
      : input.destinationPostalCode
        ? `${c.mainland} · ${c.destination} ${input.destinationPostalCode}`
        : c.mainland;

  const coverage = coverageCopy(input, lang);

  return (
    <section
      ref={sectionRef}
      className="results-section"
      data-test-id="results"
      aria-live="polite"
      aria-labelledby="results-title"
      tabIndex={-1}
    >
      <div className="results-heading">
        <div>
          <span className="eyebrow">{c.eyebrow}</span>
          <h2 id="results-title">
            {quotes.length} {quotes.length === 1 ? c.option : c.options}
          </h2>
          <p>
            {input.weightKg} kg · {input.lengthCm} × {input.widthCm} × {input.heightCm} cm · {routeLabel}
          </p>
        </div>

        {quotes[0]?.priceCents !== null && quotes[0] && (
          <div className="best-price">
            <small>{c.lowest}</small>
            <strong data-test-id="bestPrice">{formatPrice(quotes[0].priceCents)}</strong>
            <span>{quotes[0].provider}</span>
            {savingsCents !== null && (
              <small className="savings-note">
                {formatPrice(savingsCents)} {c.belowNext}
              </small>
            )}
          </div>
        )}
      </div>

      {quotes.length === 0 ? (
        <div className="empty-result">
          <strong>{c.emptyTitle}</strong>
          <span>{c.emptyBody}</span>
          <a className="empty-result-link" href="#providers">
            {c.browse} <span aria-hidden="true">↓</span>
          </a>
        </div>
      ) : (
        <>
          <div className="handoff-note">
            <strong>{c.verify}</strong>
            <span>{c.handoff}</span>
          </div>

          <div className="quote-list">
            {quotes.map((item, index) => {
              const summary = shipmentSummary(input, item, lang);
              const currentCopyState = copyState?.id === item.id ? copyState.status : null;

              return (
                <article
                  className={index === 0 ? "quote-card quote-card--best" : "quote-card"}
                  key={item.id}
                >
                  <div className="quote-topline">
                    <div>
                      <span className="provider-name">{item.provider}</span>
                      <h3>{quoteServiceLabel(item, lang)}</h3>
                    </div>
                    <div className="quote-price-stack">
                      <strong className="quote-price">{formatPrice(item.priceCents)}</strong>
                      {index === 0 && <span className="best-label">{c.lowest}</span>}
                    </div>
                  </div>

                  <div className="quote-badges">
                    <span className={`accuracy accuracy--${item.accuracy}`}>
                      {badge(item.accuracy, lang)}
                    </span>
                    <span className="quote-audience">
                      {item.audience === "consumer" ? c.public : c.business}
                    </span>
                    <span>{quoteEtaLabel(item, lang)}</span>
                  </div>

                  <div className="quote-actions">
                    <a
                      className={index === 0 ? "quote-cta quote-cta--primary" : "quote-cta"}
                      href={item.actionUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${c.verify}: ${item.provider}`}
                    >
                      {c.verify} <span aria-hidden="true">↗</span>
                    </a>

                    <button
                      type="button"
                      className="quote-copy"
                      data-test-id={`copy-${item.id}`}
                      onClick={() => void copyQuote(item)}
                      aria-live="polite"
                    >
                      {currentCopyState === "success"
                        ? c.copied
                        : currentCopyState === "error"
                          ? c.copyFailed
                          : c.copy}
                    </button>
                  </div>

                  {currentCopyState === "error" && (
                    <div className="copy-fallback">
                      <label htmlFor={`manual-copy-${item.id}`}>{c.manualCopy}</label>
                      <textarea
                        id={`manual-copy-${item.id}`}
                        readOnly
                        value={summary}
                        onFocus={(event) => event.currentTarget.select()}
                      />
                    </div>
                  )}

                  {item.actionRequiresAccount && (
                    <small className="handoff-account">{c.accountRequired}</small>
                  )}

                  <details className="quote-more">
                    <summary>{c.why}</summary>
                    <p>{quoteExplanationLabel(item, lang)}</p>
                    <h4>{c.technical}</h4>
                    <ul>
                      {item.details.map((detail) => (
                        <li key={detail}>{localizeQuoteDetail(detail, lang)}</li>
                      ))}
                    </ul>
                    <div className="source-row">
                      <span>
                        {c.checked}: {quoteEffectiveDateLabel(item, lang)}
                      </span>
                      <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                        {quoteSourceLabel(item, lang)} ↗
                      </a>
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        </>
      )}

      <details className="coverage-disclosure">
        <summary>{c.coverage}</summary>
        <strong>{coverage.title}</strong>
        <p>{coverage.body}</p>
      </details>
    </section>
  );
}
