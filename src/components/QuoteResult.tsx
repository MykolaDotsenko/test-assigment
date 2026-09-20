import { formatPrice, type ParcelInput, type Quote } from "../domain/finlandTariffs";

function badge(accuracy: Quote["accuracy"]) {
  if (accuracy === "exact-public") return "Exact public tariff";
  if (accuracy === "exact-list") return "Contract list calculation";
  if (accuracy === "inactive") return "Inactive";
  return "Live quote";
}

export default function QuoteResult({ input, quotes }: { input: ParcelInput; quotes: Quote[] }) {
  return (
    <section className="results-section" aria-live="polite" aria-labelledby="results-title">
      <div className="results-heading">
        <div>
          <span className="eyebrow">Comparison</span>
          <h2 id="results-title">{quotes.length} calculable option{quotes.length === 1 ? "" : "s"}</h2>
          <p>{input.weightKg} kg · {input.lengthCm} × {input.widthCm} × {input.heightCm} cm · {input.fromPostalCode} → {input.toPostalCode}</p>
        </div>
        {quotes[0]?.priceCents !== null && quotes[0] && (
          <div className="best-price">
            <small>Lowest calculated</small>
            <strong data-test-id="bestPrice">{formatPrice(quotes[0].priceCents)}</strong>
            <span>{quotes[0].provider}</span>
          </div>
        )}
      </div>

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
