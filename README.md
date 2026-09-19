# Radius — Delivery Quote Lab

[![Quality](https://github.com/MykolaDotsenko/test-assigment/actions/workflows/quality.yml/badge.svg)](https://github.com/MykolaDotsenko/test-assigment/actions/workflows/quality.yml)

**A transparent delivery-fee explorer rebuilt from a small React/TypeScript home assignment into a production-minded frontend case study.**

[**Open the live app →**](https://test-assigment-theta.vercel.app) · [Architecture](./ARCHITECTURE.md)

Radius answers one practical question: **what will this delivery cost, and why?**

Instead of treating the assignment as a form that prints five numbers, the product exposes the pricing contract: cart threshold, customer-to-venue distance, delivery range, fee composition, availability, and the next useful action when a small-order surcharge applies.

## Product capabilities

- live venue static + dynamic pricing data
- integer-cent cart parsing with decimal comma and decimal point support
- manual coordinates or browser geolocation
- quick Helsinki location presets for exploration
- Haversine customer-to-venue distance
- explicit delivery-range utilization
- available vs outside-delivery-area product states
- small-order threshold insight: exactly how much to add to remove the surcharge
- inspectable cart / surcharge / delivery / distance / total breakdown
- previous request cancellation so stale responses cannot overwrite a newer quote
- session-only recent estimates without persisting precise coordinates
- responsive desktop/mobile layout
- reduced-motion and forced-colors fallbacks
- no analytics or tracking

## Why this project is different

The original implementation had the core formula, but network fetching, geolocation, validation, pricing, and UI state all lived in one component. The single test submitted the form without asserting the result, and the README was still the default Vite template.

The rebuild keeps the original problem and makes the engineering decisions visible:

```text
React UI
   |
   +----> delivery domain <---- geo domain
   |
   +----> validated venue API adapter
                 |
                 +----> remote assignment API
```

The important boundaries are deliberate:

- **Money enters the domain as integer cents**, not floating-point UI state.
- **Remote JSON is treated as untrusted** and normalized before pricing uses it.
- **`max = 0` is modeled as an unavailable-distance sentinel**, not hidden behind a magic `-1` fee.
- **Provider failure and out-of-range delivery are different states.**
- **Editable form values remain strings** until submit, so partial input is not coerced into misleading numbers.
- **In-flight requests are abortable**, protecting the interface from response races.
- **Precise coordinates are never persisted.**

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full dependency rules and state contract.

## Pricing model

For a valid distance range, the home-assignment pricing formula is preserved:

```text
delivery fee = base price + a + round(b × distance / 10)
```

The small-order surcharge is:

```text
max(0, order minimum without surcharge - cart value)
```

And the quoted total is:

```text
cart value + small-order surcharge + delivery fee
```

Distance is calculated with the Haversine formula using the customer and venue coordinates.

## Stack

### Runtime

- React 18
- TypeScript (strict)
- Vite 6
- Axios
- Tailwind/PostCSS pipeline + custom responsive CSS
- Geolocation API
- Intl formatting APIs

### Quality

- Vitest
- ESLint flat config
- TypeScript build checks
- GitHub Actions
- Vercel deployment

The project intentionally does not introduce a global state library, router, map SDK, animation runtime, or backend. They would increase the dependency and failure surface without improving this single-screen workflow.

## Quality evidence

Pure tests cover the behavior most likely to produce expensive regressions:

- decimal money parsing without floating-point input drift
- coordinate boundaries
- venue-slug normalization
- small-order surcharge arithmetic
- distance-range matching
- `max = 0` unavailable sentinel semantics
- delivery-fee calculation
- explicit out-of-range quotes
- Haversine invariants and a real Helsinki distance sanity check
- malformed static/dynamic provider payloads

CI runs the complete gate on pushes and pull requests:

```bash
npm run check
```

which executes:

```text
ESLint with zero warnings
→ Vitest domain / boundary tests
→ TypeScript production build
→ Vite production bundle
```

## Accessibility and UX

Radius uses native browser semantics before custom interaction code:

- visible labels for every field
- grouped coordinates via `fieldset` / `legend`
- `aria-invalid` and field-specific error relationships
- `role="alert"` for request failures
- `aria-live` for quote results
- native `meter` for distance utilization
- keyboard-operable presets and actions
- visible `:focus-visible` states
- reduced-motion support
- forced-colors fallback
- no color-only distinction between available and unavailable states

## Privacy boundary

Browser geolocation is optional. If the user grants access, coordinates are used only to calculate the current quote. **Precise coordinates are not stored in localStorage, analytics, or a backend.** Recent estimates retain only cart value, distance, total, and availability for the current page session.

## Run locally

```bash
npm ci
npm run dev
```

Open the local Vite URL and use the included Helsinki example, one of the quick presets, or your own coordinates.

Run the full verification gate:

```bash
npm run check
```

## Repository evolution

This repository intentionally preserves its origin as a technical assignment. The goal of the rebuild is not to disguise that history, but to demonstrate the follow-through expected in production work: model the domain explicitly, isolate unreliable boundaries, design useful states, test the rules, document the trade-offs, and ship a product surface that explains itself.
