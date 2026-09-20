# Radius architecture

Radius is a small global delivery-planning application with one core rule: **network services may help resolve places, but they never own the pricing calculation.**

## Dependency direction

```text
React UI
  |
  +--> delivery estimate domain <---- geo domain
  |
  +--> geocoding boundary
          |
          +--> Photon / OpenStreetMap
          |
          +--> Open-Meteo locality fallback
```

The pricing and geo domains do not import React, the DOM, storage, or a network client.

## Why the product changed

The original home assignment depended on a development venue API, a venue slug, and explicit latitude/longitude fields. That made the demo fragile and Helsinki-specific.

Radius v2 removes those constraints:

- no venue slug;
- no manual GPS coordinates;
- no browser geolocation permission;
- no external pricing API;
- no single-city assumptions.

Users describe pickup and drop-off in normal language. A provider boundary resolves those descriptions to candidate places, and the deterministic domain calculates the estimate locally.

## Geocoding boundary

### Primary: Photon

Photon searches OpenStreetMap-backed place data and is well suited to addresses, landmarks, streets, cities, and other named places.

The app sends requests only after explicit form submission. It does not implement keystroke autocomplete. Successful results are cached in memory for the current page session.

### Fallback: Open-Meteo Geocoding

If Photon is unavailable or returns no result, Radius falls back to Open-Meteo's global locality/postal-code search.

This fallback is deliberately narrower than the primary provider: it improves resilience for city/postal-code searches without pretending to be a second full address engine.

### Trust boundary

Both provider payloads are treated as unknown JSON. Coordinates, names, country codes, and result structure are normalized before the rest of the app can use them.

## Pricing domain

The user controls the market model:

```text
modeled road distance = air distance × road factor
distance charge       = per-km rate × modeled road distance
base quote            = max(minimum fee, base fee + distance charge)
service quote         = base quote × service factor
planning range        = route-class uncertainty around the service quote
```

The estimate is intentionally labeled as a **planning estimate**, not a carrier checkout price.

Road factor is explicit because Radius does not claim to have turn-by-turn routing. This is more honest than inventing precise road mileage from straight-line coordinates.

## State rules

- route text stays human-readable;
- changing From/To invalidates the resolved route immediately;
- service and pricing-model changes recompute locally without another network request;
- swapping a resolved route reuses the already-resolved candidates;
- only explicit form submission performs geocoding;
- in-flight searches are abortable;
- no searched places are persisted to localStorage;
- provider failure never corrupts the pricing domain.

## Runtime dependency policy

The shipped app depends only on React and React DOM. Native Fetch, AbortController, Intl, details/summary, and semantic HTML cover the remaining runtime needs.

## Test pyramid

```text
Playwright + axe
      ↑
deterministic mocked geocoding journeys
      ↑
provider-payload normalization tests
      ↑
pure pricing + geo domain tests
```

Browser tests cover successful planning, place ambiguity, fallback geocoding, validation, stale-route invalidation, accessibility, and mobile overflow.

## Deployment

Vercel is the canonical deployment target and tracks `main`. The app requires no API key and no server runtime.
