import { PROVIDER_DIRECTORY } from "../domain/finlandTariffs";

const statusLabel = {
  calculated: "Calculated in Radius",
  "live-quote": "Official live quote",
  inactive: "Not currently available from Finland",
} as const;

export default function ProviderDirectory() {
  return (
    <section className="directory-section" aria-labelledby="directory-title">
      <div className="directory-heading">
        <div>
          <span className="eyebrow">Finnish carrier directory</span>
          <h2 id="directory-title">Major parcel & courier operators serving Finland</h2>
        </div>
        <p>“All” is treated as major nationwide and international parcel/courier operators, not every local same-day courier company.</p>
      </div>

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
              <a href={entry.sourceUrl} target="_blank" rel="noreferrer">{entry.sourceLabel} ↗</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
