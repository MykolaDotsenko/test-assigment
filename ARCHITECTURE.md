# Radius architecture

Radius is intentionally small, but it treats **untrusted network data**, **money**, **distance pricing**, and **browser permissions** as real boundaries rather than component details.

## Dependency direction

```text
React UI
  |
  +--> delivery domain <---- geo domain
  |
  +--> venue API adapter
          |
          +--> axios / remote home-assignment API
```

The domain does not import React, Axios, the DOM, geolocation, or browser storage.

## Responsibilities

### `src/domain/delivery.ts`

Owns the pricing contract:

- decimal-string to integer-cent parsing;
- coordinate and venue-slug validation;
- small-order surcharge;
- distance-range selection;
- `max = 0` unavailable sentinel handling;
- distance fee formula;
- available vs out-of-range quote state;
- presentation-safe money/distance formatting.

An unavailable delivery is represented explicitly with nullable fee/total fields. The domain never uses a magic negative delivery fee.

### `src/domain/geo.ts`

Owns the Haversine calculation. It is deterministic and browser-independent.

### `src/services/venueApi.ts`

Owns HTTP concerns and the trust boundary around the remote API.

Both static and dynamic venue payloads are fetched in parallel. Unknown JSON is validated and normalized into one `VenueProfile` before pricing can consume it. Malformed provider data fails at the boundary instead of leaking `undefined` through the UI.

### `src/components/Calculator.tsx`

Owns orchestration only:

1. validate editable strings;
2. cancel the previous in-flight quote;
3. fetch a normalized venue profile;
4. calculate distance;
5. call the pricing domain;
6. render success, out-of-range, or failure state.

Geolocation is a progressive convenience. Manual coordinates remain the primary resilient path.

## State rules

- Form fields remain strings until submit so incomplete user input is not coerced into misleading numbers.
- Money becomes integer cents before entering the pricing domain.
- A new request aborts the previous request to prevent stale responses from winning a race.
- Precise coordinates are not persisted.
- Recent estimates are session-only presentation state.
- Provider failure is distinct from a valid "outside delivery area" result.

## Why no global state library?

There is one screen and one authoritative quote workflow. Introducing Redux, Zustand, a query cache, or a service container would create more lifecycle and synchronization surface than the product requires.

## Quality strategy

The CI gate runs:

```bash
npm run lint
npm test
npm run build
```

Pure tests target the high-risk rules: decimal money parsing, coordinate boundaries, distance-range sentinels, fee arithmetic, outside-area behavior, Haversine distance, and malformed API payloads.

The UI uses native labels, fieldsets, meter, buttons, `aria-invalid`, `aria-describedby`, `aria-live`, `role="alert"`, visible focus, reduced-motion handling, and forced-colors fallbacks.
