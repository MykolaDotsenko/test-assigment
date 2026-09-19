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
          +--> native Fetch / remote home-assignment API
```

The domain does not import React, the DOM, geolocation, storage, or a network client.

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

Both static and dynamic venue payloads are fetched in parallel with native Fetch. Unknown JSON is validated and normalized into one `VenueProfile` before pricing can consume it. HTTP failure, timeout, malformed data, and an unknown venue slug are translated into bounded product errors.

### `src/components/Calculator.tsx`

Owns orchestration only:

1. validate editable strings;
2. cancel the previous in-flight quote;
3. fetch a normalized venue profile;
4. calculate distance;
5. call the pricing domain;
6. render success, out-of-range, or failure state.

Geolocation is a progressive convenience. Manual coordinates remain the resilient path.

## State rules

- Form fields remain strings until submit so incomplete user input is not coerced into misleading numbers.
- Money becomes integer cents before entering the pricing domain.
- A new request aborts the previous request to prevent stale responses from winning a race.
- Precise coordinates are not persisted.
- Recent estimates are session-only presentation state.
- Provider failure is distinct from a valid "outside delivery area" result.

## Runtime dependency policy

The shipped application depends only on React and React DOM.

No router, state library, API client, UI kit, CSS framework, map SDK, or animation runtime is justified by this one-screen workflow. Browser platform APIs are sufficient and keep the failure/supply-chain surface small.

## Test pyramid

```text
Playwright + axe
     ↑
HTTP boundary mocked at browser level
     ↑
Vitest domain / provider normalization tests
     ↑
Pure pricing + geo functions
```

The browser suite uses deterministic mocked provider responses so it can verify product behavior without coupling CI reliability to a third-party development API.

## Quality gate

Pull requests run:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

The browser matrix covers desktop Chromium and a Pixel 7 profile. Axe checks the completed quote state for serious/critical WCAG A/AA regressions. Failures retain Playwright traces and screenshots where applicable.
