# Radius Finland architecture

Radius is a carrier-specific tariff engine. It intentionally does not share one generic pricing formula across providers.

## Flow

```text
shipment inputs
  ├─ Finnish postal-code validation
  ├─ actual weight
  └─ dimensions
        ↓
carrier-specific eligibility
        ↓
carrier-specific tariff function
        ↓
normalized Quote[]
        ↓
sort by calculable price
        ↓
render confidence + official source
```

## Accuracy model

Each result is classified as one of:

- **exact-public** — directly calculable from a current public consumer tariff;
- **exact-list** — directly calculable from a published business/list tariff, before any customer-specific discount;
- **live-quote** — official live/account quote required because material variables are dynamic or account-specific;
- **inactive** — service is currently not offered from Finland.

This is a core domain distinction, not just a UI badge.

## Carrier rules

### Posti

Rotation-aware size matching selects the smallest eligible XXS–XL product. XXL uses the official longest-side and length-plus-girth constraint. Åland postal codes (22xxx) switch to the separate Posti Åland price table.

### Matkahuolto

Radius prices only the current consumer sizes whose prices are directly exposed by the official public page. Larger services remain visible in the provider directory rather than being filled from stale historic tariffs.

### GLS

GLSparcel.fi is modeled by weight band. Pickup +€20 and door delivery +€5 are applied from the public tariff. Door delivery is forced above 15 kg. Dimension and girth limits are evaluated before quoting.

### PostNord

PostNord contract list pricing uses:

```text
volume m³ × 280 kg
max(actual, volumetric)
→ published weight band
→ possible special handling
→ current parcel fuel surcharge
→ Finnish VAT
```

Only nationwide domestic Locker and Service Point products are auto-calculated. Radius does not guess PostNord Home zone/rural/island pricing without the full official postal-code surcharge model.

## Data freshness

Tariffs are versioned in source with explicit effective/check dates. Dynamic providers remain live-quote-only unless their changing surcharge inputs are modeled explicitly.

## Quality strategy

Unit tests cover:
- Finnish postal codes;
- decimal input;
- rotation-aware box matching;
- Posti Åland tariff;
- GLS mandatory home delivery;
- PostNord volumetric weight;
- PostNord fuel + VAT pipeline.

Browser tests cover:
- consumer comparison;
- business/list-rate mode;
- stale result invalidation on input edit;
- validation;
- accessibility;
- mobile overflow.
