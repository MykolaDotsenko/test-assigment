# Radius — Global Delivery Planner

[![Quality](https://github.com/MykolaDotsenko/test-assigment/actions/workflows/quality.yml/badge.svg)](https://github.com/MykolaDotsenko/test-assigment/actions/workflows/quality.yml)

**Search two places anywhere in the world, resolve them from normal human text, and apply a transparent delivery-pricing model locally.**

[**Open the live app →**](https://test-assigment-theta.vercel.app) · [Architecture](./ARCHITECTURE.md) · [Browser tests](./e2e/radius.spec.ts)

## What changed

Radius started as a Helsinki-specific delivery home assignment that required a venue slug and explicit latitude/longitude values. That was useful for demonstrating one provider contract, but it was not a reliable product.

Radius v2 removes the provider lock-in:

- no venue slug;
- no manual GPS fields;
- no browser location permission;
- no external pricing API;
- no single-country assumptions.

Users type normal place descriptions such as:

- `Turku railway station, Finland`
- `Helsinki Airport, Finland`
- `JFK Airport, New York`
- `Potsdam, Germany`
- a street address, landmark, city, or postal code

## Product capabilities

- global forward geocoding through Photon / OpenStreetMap
- Open-Meteo locality/postal-code fallback when the primary search is unavailable or empty
- candidate selection when a place query is ambiguous
- Haversine air distance
- configurable road-distance factor
- user-controlled currency, base fee, per-km rate, and minimum fee
- Economy / Standard / Express service profiles
- local / metro / regional / long-distance route classification
- planning fee range instead of false single-number precision
- ETA planning window
- cross-border warning without inventing customs/tax data
- route swap without a second lookup
- in-memory query cache
- abortable place searches
- responsive mobile-first UX
- reduced-motion and forced-colors support
- no analytics and no persistent location history

## Reliability model

The previous version could fail completely when the remote venue-pricing API was unavailable.

The current version separates concerns:

```text
place search may fail
        ↓
pricing domain still remains deterministic and independent

Photon search
    ↓ fallback
Open-Meteo locality search
    ↓
normalized places
    ↓
Haversine + road factor
    ↓
local pricing model
```

Network access is used only to translate human place descriptions into coordinates. Once both places are resolved, service-level and pricing changes are recalculated locally.

## Pricing model

Radius does **not** pretend to know the real checkout price of every courier in every country.

Instead, it provides an inspectable planning model:

```text
modeled road distance = air distance × road factor
distance charge       = per-km rate × modeled road distance
base quote            = max(minimum fee, base fee + distance charge)
service quote         = base quote × service factor
planning range        = uncertainty band based on route scale
```

The default values are only a demo baseline. Open **Pricing model** to match a local market or business.

## Stack

### Runtime

- React 19.3
- TypeScript 6
- Vite 8
- native Fetch + AbortController
- Intl currency formatting
- custom responsive CSS
- Photon geocoding
- Open-Meteo geocoding fallback

Runtime dependencies remain only **React and React DOM**.

### Verification

- Vitest 5
- Playwright 1.63
- axe-core accessibility checks
- ESLint 10
- strict TypeScript
- GitHub Actions on Node 24
- Dependabot
- Vercel production deployment from `main`

## Quality evidence

Pure tests verify:

- multi-currency decimal precision
- JPY zero-decimal handling
- road-factor validation
- route classification
- deterministic fee ranges
- minimum-fee floor
- international-route semantics
- Haversine invariants
- Photon GeoJSON normalization
- Open-Meteo fallback normalization
- malformed coordinate rejection

Browser tests verify:

- global route planning from human-readable place names
- ambiguous-result selectors
- stale route removal after editing From/To
- Photon failure → Open-Meteo fallback
- validation before any network request
- serious/critical WCAG A/AA regression checks
- horizontal-overflow protection on desktop and Pixel 7

## Data sources

- Photon provides OpenStreetMap-backed forward geocoding: https://github.com/komoot/photon
- Open-Meteo provides the city/postal-code fallback: https://open-meteo.com/en/docs/geocoding-api

Searches happen only after the user presses **Plan delivery**. The app does not send keystrokes to a provider and does not persist searched places.

## Run locally

```bash
npm ci
npm run dev
```

Run the static/unit quality gate:

```bash
npm run check
```

Install Chromium once and run browser verification:

```bash
npx playwright install chromium
npm run test:e2e
```

## License

MIT. See [LICENSE](./LICENSE).
