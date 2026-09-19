import type { DeliveryQuote } from "../domain/delivery";
import { formatCents, formatDistance } from "../domain/delivery";

interface QuoteResultProps {
  quote: DeliveryQuote;
}

function BreakdownRow({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="breakdown-row">
      <span>{label}</span>
      <strong data-test-id={testId}>{value}</strong>
    </div>
  );
}

export default function QuoteResult({ quote }: QuoteResultProps) {
  const distancePercent = Math.round((quote.distanceUtilization ?? 0) * 100);

  return (
    <section className="result-card" aria-live="polite" aria-labelledby="quote-result-title">
      <div className="result-heading-row">
        <div>
          <span className={`status-pill ${quote.available ? "status-pill--positive" : "status-pill--warning"}`}>
            {quote.available ? "Delivery available" : "Outside delivery area"}
          </span>
          <h2 id="quote-result-title">
            {quote.available && quote.totalCents !== null
              ? formatCents(quote.totalCents)
              : "No delivery quote"}
          </h2>
          <p>
            {quote.available
              ? "Live venue pricing, calculated locally and explained line by line."
              : "The venue data is valid, but this location falls outside its configured delivery ranges."}
          </p>
        </div>
        <div className="distance-orbit" aria-hidden="true">
          <span>{distancePercent}%</span>
          <small>radius</small>
        </div>
      </div>

      {quote.maxDeliveryDistanceMeters && (
        <div className="distance-meter-block">
          <div className="meter-labels">
            <span>{formatDistance(quote.distanceMeters)} from venue</span>
            <span>{formatDistance(quote.maxDeliveryDistanceMeters)} limit</span>
          </div>
          <meter
            className="distance-meter"
            min={0}
            max={quote.maxDeliveryDistanceMeters}
            value={Math.min(quote.distanceMeters, quote.maxDeliveryDistanceMeters)}
          >
            {distancePercent}%
          </meter>
        </div>
      )}

      {quote.available && quote.deliveryFeeCents !== null && quote.totalCents !== null ? (
        <div className="result-grid">
          <div className="breakdown-panel">
            <h3>Price anatomy</h3>
            <BreakdownRow
              label="Cart"
              value={formatCents(quote.cartValueCents)}
              testId="resultCartValue"
            />
            <BreakdownRow
              label="Small-order surcharge"
              value={formatCents(quote.smallOrderSurchargeCents)}
              testId="smallOrderSurcharge"
            />
            <BreakdownRow
              label="Delivery fee"
              value={formatCents(quote.deliveryFeeCents)}
              testId="deliveryFee"
            />
            <BreakdownRow
              label="Delivery distance"
              value={formatDistance(quote.distanceMeters)}
              testId="deliveryDistance"
            />
            <div className="breakdown-total">
              <span>Total</span>
              <strong data-test-id="totalPrice">{formatCents(quote.totalCents)}</strong>
            </div>
          </div>

          <div className="insight-panel">
            <span className="eyebrow">Next best move</span>
            {quote.amountUntilNoSurchargeCents > 0 ? (
              <>
                <h3>Add {formatCents(quote.amountUntilNoSurchargeCents)} to the cart</h3>
                <p>
                  That removes the small-order surcharge. The calculator keeps this signal separate from
                  the delivery fee so the pricing rule stays inspectable.
                </p>
              </>
            ) : (
              <>
                <h3>No small-order surcharge</h3>
                <p>
                  The cart already meets the venue threshold. Your total is the cart value plus the
                  distance-based delivery fee.
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="outside-note">
          <strong>Try a closer location.</strong>
          <span>
            Your cart is still valid; only the delivery-distance rule prevents a quote for this point.
          </span>
        </div>
      )}
    </section>
  );
}
