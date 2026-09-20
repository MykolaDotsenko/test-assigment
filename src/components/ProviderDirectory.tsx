import { useState } from "react";
import {
  PROVIDER_DIRECTORY,
  TARIFF_SNAPSHOT_DATE,
  type ProviderDirectoryEntry,
} from "../domain/finlandTariffs";
import { COPY, type Lang } from "../i18n";

type DirectoryFilter = "all" | ProviderDirectoryEntry["status"];

const FI_PROVIDER_COPY: Record<string, { scope: string; summary: string }> = {
  Posti: {
    scope: "Kotimaan paketit",
    summary: "Julkiset verkkohinnat kokoluokittain. Pakettitutka soveltaa julkaistuja koko-, paino- ja Ahvenanmaa-sääntöjä.",
  },
  Matkahuolto: {
    scope: "Kotimaan pakettipalvelut",
    summary: "Julkiset pakettihinnat lasketaan vain niiltä kokoluokilta, joille ajantasainen hinta on julkaistu.",
  },
  "GLS Finland": {
    scope: "Kotimaan pakettipalvelu",
    summary: "Julkiset painoluokat sekä lähettäjän nouto- ja kotiinkuljetuslisät huomioidaan.",
  },
  PostNord: {
    scope: "Yritysten pakettipalvelut",
    summary: "Julkaistu listahinta lasketaan laskutuspainon, polttoainelisän, ALV:n ja soveltuvien lisämaksujen perusteella.",
  },
  FedEx: {
    scope: "Kansainvälinen pika- ja pakettikuljetus",
    summary: "Lopullinen hinta riippuu reitistä, palvelusta sekä muuttuvista polttoaine- ja käsittelylisistä.",
  },
  UPS: {
    scope: "Kansainvälinen paketti- ja pikakuljetus",
    summary: "Virallinen hinta muodostuu valitusta palvelusta sekä polttoaine-, alue- ja mahdollisista kysyntälisistä.",
  },
  "DHL Express": {
    scope: "Kansainvälinen pikakuljetus",
    summary: "Ajantasainen hinta määräytyy lähtö- ja kohdetietojen, laskutuspainon sekä palvelutason mukaan.",
  },
  "DSV Parcel / Schenker": {
    scope: "Paketti- ja maantiekuljetukset",
    summary: "Hinnoittelu on sopimus- tai tarjouskohtaista ja sisältää muuttuvia polttoainelisiä.",
  },
  "Budbee / Instabee": {
    scope: "Verkkokaupan koti- ja pakettiautomaattitoimitukset",
    summary: "Aktiivinen suomalainen viimeisen kilometrin verkosto. Hinnoittelu on kauppias- ja sopimuskohtaista.",
  },
  Kaukokiito: {
    scope: "Kotimaan rahti ja jakelu",
    summary: "Valtakunnallinen suomalainen rahti- ja jakeluoperaattori. Hinta riippuu lähetyksestä ja asiakassopimuksesta.",
  },
  "Jetpak Finland": {
    scope: "Aikakriittinen kuriiri- ja pikakuljetus",
    summary: "Saman päivän ja seuraavan päivän ovelta ovelle -kuljetuksia Suomessa ja kansainvälisesti.",
  },
  "DHL Freight": {
    scope: "Kotimaan ja Euroopan maantierahti",
    summary: "Rahtihinta on lähetyskohtainen ja siihen vaikuttavat muuttuvat lisämaksut.",
  },
  Bring: {
    scope: "Aiempi kotimaan ja Suomesta lähtevä palvelu",
    summary: "Kotimaan palvelut ja Suomesta lähtevät lähetykset eivät ole tällä hetkellä aktiivisena palveluna.",
  },
};

const DAY_MS = 86_400_000;
const STALE_AFTER_DAYS = 31;
const SNAPSHOT_AGE_DAYS = Math.max(
  0,
  Math.floor((Date.now() - Date.parse(`${TARIFF_SNAPSHOT_DATE}T00:00:00Z`)) / DAY_MS),
);
const SNAPSHOT_IS_STALE = SNAPSHOT_AGE_DAYS > STALE_AFTER_DAYS;

function sourceAction(status: ProviderDirectoryEntry["status"], lang: Lang) {
  const c = COPY[lang].directory;
  if (status === "live-quote") return c.officialPricing;
  if (status === "inactive") return c.officialStatus;
  return c.officialTariff;
}

function audienceLabel(audience: ProviderDirectoryEntry["audience"], lang: Lang) {
  const c = COPY[lang].directory;
  if (audience === "consumer") return c.public;
  if (audience === "business") return c.business;
  return c.both;
}

function statusLabel(status: ProviderDirectoryEntry["status"], lang: Lang) {
  const c = COPY[lang].directory;
  if (status === "calculated") return c.calculatedStatus;
  if (status === "live-quote") return c.liveStatus;
  return c.inactiveStatus;
}

export default function ProviderDirectory({ lang }: { lang: Lang }) {
  const [filter, setFilter] = useState<DirectoryFilter>("calculated");
  const c = COPY[lang].directory;
  const calculatedCount = PROVIDER_DIRECTORY.filter((entry) => entry.status === "calculated").length;
  const liveQuoteCount = PROVIDER_DIRECTORY.filter((entry) => entry.status === "live-quote").length;
  const visibleEntries =
    filter === "all"
      ? PROVIDER_DIRECTORY
      : PROVIDER_DIRECTORY.filter((entry) => entry.status === filter);

  const filters: { value: DirectoryFilter; label: string }[] = [
    { value: "calculated", label: c.filters.calculated },
    { value: "live-quote", label: c.filters.live },
    { value: "all", label: c.filters.all },
    { value: "inactive", label: c.filters.inactive },
  ];

  return (
    <section className="directory-section" id="providers" aria-labelledby="directory-title">
      <div className="directory-heading">
        <div>
          <span className="eyebrow">{c.eyebrow}</span>
          <h2 id="directory-title">{c.title}</h2>
        </div>
        <p>{c.intro}</p>
      </div>

      <div className="directory-metrics" aria-label="Carrier coverage summary">
        <span><strong>{PROVIDER_DIRECTORY.length}</strong> {c.verified}</span>
        <span><strong>{calculatedCount}</strong> {c.calculated}</span>
        <span><strong>{liveQuoteCount}</strong> {c.live}</span>
        <span>{c.reviewed} <strong>{TARIFF_SNAPSHOT_DATE}</strong></span>
      </div>

      <div className="directory-toolbar">
        <div className="directory-filters" role="group" aria-label="Carrier filters">
          {filters.map((item) => {
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
        <small aria-live="polite">{visibleEntries.length} {c.shown}</small>
      </div>

      {SNAPSHOT_IS_STALE && (
        <div className="freshness-warning" role="status">
          <strong>{c.tariffReview}</strong>
          <span>{c.tariffReviewBody}</span>
        </div>
      )}

      <div className="directory-grid">
        {visibleEntries.map((entry) => {
          const localized = lang === "fi" ? FI_PROVIDER_COPY[entry.provider] : undefined;
          return (
            <article className="directory-card" key={entry.provider}>
              <div className="directory-card-top">
                <strong>{entry.provider}</strong>
                <span className={`directory-status directory-status--${entry.status}`}>
                  {statusLabel(entry.status, lang)}
                </span>
              </div>
              <small>{localized?.scope ?? entry.scope} · {audienceLabel(entry.audience, lang)}</small>
              <p>{localized?.summary ?? entry.tariffSummary}</p>
              <div className="source-row">
                <span>{entry.freshness}</span>
                <a
                  href={entry.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${entry.provider}: ${entry.sourceLabel}`}
                  title={entry.sourceLabel}
                >
                  {sourceAction(entry.status, lang)}
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
