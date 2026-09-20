import {
  PROVIDER_DIRECTORY,
  TARIFF_SNAPSHOT_DATE,
} from "../domain/finlandTariffs";

const statusLabel = {
  calculated: "Calculated in Pakettitutka",
  "live-quote": "Official live quote",
  inactive: "Not currently available from Finland",
} as const;

const DAY_MS = 86_400_000;
const STALE_AFTER_DAYS = 31;

function sourceAction(status: (typeof PROVIDER_DIRECTORY)[number]["status"]) {
  if (status === "live-quote") return "Official service / pricing ↗";
  if (status === "inactive") return "Official service status ↗";
  return "Official tariff source ↗";
}

export default function ProviderDirectory() {
  const calculatedCount = PROVIDER_DIRECTORY.filter((entry) => entry.status === "calculated").length;
  const liveQuoteCount = PROVIDER_DIRECTORY.filter((entry) => entry.status === "live-quote").length;
  const snapshotAgeDays = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(`${TARIFF_SNAPSHOT_DATE}T00:00:00Z`)) / DAY_MS),
  );
  const snapshotIsStale = snapshotAgeDays > STALE_AFTER_DAYS;

  return (
    <section className="directory-section" id="providers" aria-labelledby="directory-title">
      <div className="directory-heading">
        <div>
          <span className="eyebrow">Finnish carrier directory</span>
          <h2 id="directory-title">Parcel, express, last-mile & freight operators serving Finland</h2>
        </div>
        <p>Coverage focuses on established nationwide, international, last-mile and time-critical operators with verifiable Finnish service. Small local courier firms are not represented as a complete national market list.</p>
      </div>

      <div className="directory-metrics" aria-label="Carrier coverage summary">
        <span><strong>{PROVIDER_DIRECTORY.length}</strong> verified operators</span>
        <span><strong>{calculatedCount}</strong> tariff-calculated</span>
        <span><strong>{liveQuoteCount}</strong> live/account quote</span>
        <span>Reviewed <strong>{TARIFF_SNAPSHOT_DATE}</strong></span>
      </div>

      {snapshotIsStale && (
        <div className="freshness-warning" role="status">
          <strong>Tariff review due.</strong>
          <span>
            This snapshot is {snapshotAgeDays} days old. Treat calculated prices as a comparison aid and verify the linked official source before buying.
          </span>
        </div>
      )}

      <div className="directory-grid">
        {PROVIDER_DIRECTORY.map((entry) => (
          <article className="directory-card" key={entry.provider}>
            <div className="directory-card-top">
              <strong>{entry.provider}</strong>
              <span className={`directory-status directory-status--${entry.status}`}>{statusLabel[entry.status]}</span>
            </div>
            <small>{entry.scope} · {entry.audience}</small>
            <p>{entry.tariffSummary}</p>
            <div className="source-row">
              <span>{entry.freshness}</span>
              <a
                href={entry.sourceUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`${entry.provider}: ${entry.sourceLabel}`}
                title={entry.sourceLabel}
              >
                {sourceAction(entry.status)}
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
