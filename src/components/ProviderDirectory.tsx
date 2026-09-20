import { useState } from "react";
import {
  PROVIDER_DIRECTORY,
  TARIFF_SNAPSHOT_DATE,
  type ProviderDirectoryEntry,
} from "../domain/finlandTariffs";

const statusLabel = {
  calculated: "Calculated in Pakettitutka",
  "live-quote": "Official live quote",
  inactive: "Not currently available from Finland",
} as const;

type DirectoryFilter = "all" | ProviderDirectoryEntry["status"];

const FILTERS: { value: DirectoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "calculated", label: "Calculated" },
  { value: "live-quote", label: "Live quote" },
  { value: "inactive", label: "Inactive" },
];

const DAY_MS = 86_400_000;
const STALE_AFTER_DAYS = 31;
const SNAPSHOT_AGE_DAYS = Math.max(
  0,
  Math.floor((Date.now() - Date.parse(`${TARIFF_SNAPSHOT_DATE}T00:00:00Z`)) / DAY_MS),
);
const SNAPSHOT_IS_STALE = SNAPSHOT_AGE_DAYS > STALE_AFTER_DAYS;

function sourceAction(status: ProviderDirectoryEntry["status"]) {
  if (status === "live-quote") return "Official service / pricing ↗";
  if (status === "inactive") return "Official service status ↗";
  return "Official tariff source ↗";
}

function audienceLabel(audience: ProviderDirectoryEntry["audience"]) {
  if (audience === "consumer") return "Public / no-contract";
  if (audience === "business") return "Business";
  return "Public & business";
}

export default function ProviderDirectory() {
  const [filter, setFilter] = useState<DirectoryFilter>("all");
  const calculatedCount = PROVIDER_DIRECTORY.filter((entry) => entry.status === "calculated").length;
  const liveQuoteCount = PROVIDER_DIRECTORY.filter((entry) => entry.status === "live-quote").length;
  const visibleEntries =
    filter === "all"
      ? PROVIDER_DIRECTORY
      : PROVIDER_DIRECTORY.filter((entry) => entry.status === filter);

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

      <div className="directory-toolbar">
        <div className="directory-filters" role="group" aria-label="Filter carriers by pricing availability">
          {FILTERS.map((item) => {
            const count =
              item.value === "all"
                ? PROVIDER_DIRECTORY.length
                : PROVIDER_DIRECTORY.filter((entry) => entry.status === item.value).length;

            return (
              <button
                type="button"
                key={item.value}
                className={filter === item.value ? "directory-filter active" : "directory-filter"}
                aria-pressed={filter === item.value}
                onClick={() => setFilter(item.value)}
              >
                {item.label} <span>{count}</span>
              </button>
            );
          })}
        </div>
        <small aria-live="polite">{visibleEntries.length} carrier{visibleEntries.length === 1 ? "" : "s"} shown</small>
      </div>

      {SNAPSHOT_IS_STALE && (
        <div className="freshness-warning" role="status">
          <strong>Tariff review due.</strong>
          <span>
            This snapshot is {SNAPSHOT_AGE_DAYS} days old. Treat calculated prices as a comparison aid and verify the linked official source before buying.
          </span>
        </div>
      )}

      <div className="directory-grid">
        {visibleEntries.map((entry) => (
          <article className="directory-card" key={entry.provider}>
            <div className="directory-card-top">
              <strong>{entry.provider}</strong>
              <span className={`directory-status directory-status--${entry.status}`}>{statusLabel[entry.status]}</span>
            </div>
            <small>{entry.scope} · {audienceLabel(entry.audience)}</small>
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
