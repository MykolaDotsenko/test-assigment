import { formatPrice, type ParcelInput, type Quote } from "../domain/finlandTariffs";

function badge(accuracy: Quote["accuracy"]) {
  if (accuracy === "exact-public") return "Exact public tariff";
  if (accuracy === "exact-list") return "Contract list calculation";
  if (accuracy === "inactive") return "Inactive";
  return "Live quote";
}

export default function QuoteResult({ input, quotes }: { input: ParcelInput; quotes: Quote[] }) {
  const secondPrice = quotes[1]?.priceCents ?? null;
  const bestPrice = quotes[0]?.priceCents ?? null;
  const savingsCents =
    bestPrice !== null && secondPrice !== null && secondPrice > bestPrice
      ? secondPrice - bestPrice
      : null;
  const routeLabel = input.route === "aland" ? "Mainland Finland ↔ Åland" : "Mainland Finland";
  const coverage =
    input.audience === "business"
      ? {
          title: "What this comparison covers",
          body: "Published PostNord list rates are calculated here. FedEx, UPS, DHL Express and DSV remain official live/account quotes because their final prices depend on changing or contract-specific inputs.",
        }
      : input.route === "aland"
        ? {
            title: "Åland coverage",
            body: "Posti is calculated from its published Åland tariff. Matkahuolto also serves Åland, but its Åland flow uses international-parcel pricing plus a ferry surcharge, so Pakettitutka does not invent a single total.",
          }
        : {
            title: "What this comparison covers",
            body: "Pakettitutka calculates the public tariffs it can reproduce from published rules. Carriers whose final price depends on live, lane-specific or account pricing stay in the directory as official quote links.",
          };

  return (
    <section className="results-section" data-test-id="results" aria-live="polite" aria-labelledby="results-title">
      <div className="results-heading">
        <div>
          <span className="eyebrow">Comparison</span>
          <h2 id="results-title">{quotes.length} calculable option{quotes.length === 1 ? "" : "s"}</h2>
          <p>{input.weightKg} kg · {input.lengthCm} × {input.widthCm} × {input.heightCm} cm · {routeLabel}</p>
        </div>
        {quotes[0]?.priceCents !== null && quotes[0] && (
          <div className="best-price">
            <small>Lowest calculated</small>
            <strong data-test-id="bestPrice">{formatPrice(quotes[0].priceCents)}</strong>
            <span>{quotes[0].provider}</span>
            {savingsCents !== null && <small className="savings-note">{formatPrice(savingsCents)} below the next calculated option</small>}
          </div>
        )}
      </div>

      <aside className="coverage-note" aria-label={coverage.title}>
        <strong>{coverage.title}</strong>
        <p>{coverage.body}</p>
      </aside>

      {quotes.length === 0 ? (
        <div className="empty-result">
          <strong>No tariff-backed option fits these inputs.</strong>
          <span>Check the provider directory below for live-quote carriers or reduce parcel dimensions/weight.</span>
        </div>
      ) : (
        <div className="quote-list">
          {quotes.map((quote, index) => (
            <article className={index === 0 ? "quote-card quote-card--best" : "quote-card"} key={quote.id}>
              <div className="quote-topline">
                <div>
                  <span className="provider-name">{quote.provider}</span>
                  <h3>{quote.service}</h3>
                </div>
                <strong className="quote-price">{formatPrice(quote.priceCents)}</strong>
              </div>
              <div className="quote-badges">
                <span className={`accuracy accuracy--${quote.accuracy}`}>{badge(quote.accuracy)}</span>
                <span>{quote.audience === "consumer" ? "Private" : "Business"}</span>
                <span>{quote.deliveryTime}</span>
              </div>
              <p>{quote.explanation}</p>
              <details>
                <summary>Calculation details</summary>
                <ul>{quote.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
              </details>
              <div className="source-row">
                <span>Effective / checked: {quote.effectiveDate}</span>
                <a href={quote.sourceUrl} target="_blank" rel="noreferrer">{quote.sourceLabel} ↗</a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
