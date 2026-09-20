import {
  formatDistance,
  formatDuration,
  formatMoney,
  routeClassLabel,
  serviceLabel,
  type DeliveryEstimate,
  type PricingModel,
} from "../domain/delivery";
import type { PlaceMatch } from "../services/geocoder";

interface QuoteResultProps {
  estimate: DeliveryEstimate;
  model: PricingModel;
  pickupMatches: PlaceMatch[];
  dropoffMatches: PlaceMatch[];
  pickupIndex: number;
  dropoffIndex: number;
  onPickupChange: (index: number) => void;
  onDropoffChange: (index: number) => void;
}

function PlaceSelector({
  label,
  matches,
  selectedIndex,
  onChange,
}: {
  label: string;
  matches: PlaceMatch[];
  selectedIndex: number;
  onChange: (index: number) => void;
}) {
  const selected = matches[selectedIndex];

  return (
    <div className="resolved-place">
      <span>{label}</span>
      {matches.length > 1 ? (
        <select
          aria-label={`${label} resolved place`}
          value={selectedIndex}
          onChange={(event) => onChange(Number(event.target.value))}
        >
          {matches.map((match, index) => (
            <option key={match.id} value={index}>
              {match.label}
            </option>
          ))}
        </select>
      ) : (
        <strong>{selected.label}</strong>
      )}
      <small>
        {selected.source === "photon" ? "Photon / OpenStreetMap" : "Open-Meteo / GeoNames"}
      </small>
    </div>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="breakdown-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function QuoteResult({
  estimate,
  model,
  pickupMatches,
  dropoffMatches,
  pickupIndex,
  dropoffIndex,
  onPickupChange,
  onDropoffChange,
}: QuoteResultProps) {
  const pickup = pickupMatches[pickupIndex];
  const dropoff = dropoffMatches[dropoffIndex];

  return (
    <section className="result-card" aria-live="polite" aria-labelledby="estimate-title">
      <div className="result-heading-row">
        <div>
          <span className="status-pill status-pill--positive">Planning estimate</span>
          <h2 id="estimate-title" data-test-id="estimateRange">
            {formatMoney(estimate.feeLowMinor, model.currency)}
            <span className="range-dash">–</span>
            {formatMoney(estimate.feeHighMinor, model.currency)}
          </h2>
          <p>
            Transparent model range for planning. It is intentionally not presented as a carrier or
            checkout price.
          </p>
        </div>
        <div className="distance-orbit" aria-hidden="true">
          <span>{formatDistance(estimate.estimatedRoadMeters)}</span>
          <small>modeled</small>
        </div>
      </div>

      <div className="resolved-grid">
        <PlaceSelector
          label="Resolved from"
          matches={pickupMatches}
          selectedIndex={pickupIndex}
          onChange={onPickupChange}
        />
        <PlaceSelector
          label="Resolved to"
          matches={dropoffMatches}
          selectedIndex={dropoffIndex}
          onChange={onDropoffChange}
        />
      </div>

      <div className="metric-grid">
        <article>
          <span>Road estimate</span>
          <strong data-test-id="roadDistance">{formatDistance(estimate.estimatedRoadMeters)}</strong>
          <small>air distance {formatDistance(estimate.straightLineMeters)}</small>
        </article>
        <article>
          <span>ETA window</span>
          <strong>
            {formatDuration(estimate.etaMinMinutes)}–{formatDuration(estimate.etaMaxMinutes)}
          </strong>
          <small>{serviceLabel(estimate.serviceLevel)} planning speed</small>
        </article>
        <article>
          <span>Route class</span>
          <strong>{routeClassLabel(estimate.routeClass)}</strong>
          <small>{estimate.international ? "Cross-border route" : "Same-country route"}</small>
        </article>
      </div>

      <div className="result-grid">
        <div className="breakdown-panel">
          <h3>Price anatomy</h3>
          <BreakdownRow label="Base fee" value={formatMoney(model.baseFeeMinor, model.currency)} />
          <BreakdownRow
            label="Distance charge"
            value={formatMoney(estimate.distanceChargeMinor, model.currency)}
          />
          <BreakdownRow
            label="Service factor"
            value={`${serviceLabel(estimate.serviceLevel)} ×${estimate.serviceMultiplier.toFixed(2)}`}
          />
          <BreakdownRow
            label="Minimum fee"
            value={formatMoney(model.minimumFeeMinor, model.currency)}
          />
          <div className="breakdown-total">
            <span>Model midpoint</span>
            <strong data-test-id="estimateMidpoint">
              {formatMoney(estimate.feeMidMinor, model.currency)}
            </strong>
          </div>
        </div>

        <div className="insight-panel">
          <span className="eyebrow">What this means</span>
          <h3>{pickup.name} → {dropoff.name}</h3>
          <p>
            Radius uses a configurable road factor instead of pretending it has turn-by-turn routing.
            The wider price range absorbs some of that uncertainty while keeping the formula inspectable.
          </p>
          {estimate.international && (
            <div className="route-warning">
              <strong>Cross-border route</strong>
              <span>
                Customs, tolls, taxes, carrier zones, and border delays are not included in this model.
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
