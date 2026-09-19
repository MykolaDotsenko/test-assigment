import { formatCents, formatDistance } from "../domain/delivery";

export interface RecentQuote {
  id: string;
  totalCents: number | null;
  distanceMeters: number;
  cartValueCents: number;
  available: boolean;
}

interface RecentQuotesProps {
  quotes: RecentQuote[];
}

export default function RecentQuotes({ quotes }: RecentQuotesProps) {
  if (quotes.length === 0) return null;

  return (
    <section className="history-section" aria-labelledby="recent-quotes-title">
      <div>
        <span className="eyebrow">This session</span>
        <h2 id="recent-quotes-title">Recent estimates</h2>
      </div>
      <div className="history-strip">
        {quotes.map((quote) => (
          <article className="history-card" key={quote.id}>
            <span>{quote.available && quote.totalCents !== null ? formatCents(quote.totalCents) : "Out of range"}</span>
            <strong>{formatDistance(quote.distanceMeters)}</strong>
            <small>Cart {formatCents(quote.cartValueCents)}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
