# Pakettitutka architecture

Pakettitutka is a carrier-specific tariff engine. It intentionally does not share one generic pricing formula across providers.

## Flow

```text
shipment inputs
  ├─ route scope: mainland or Åland
  ├─ pricing mode: public/no-contract or published business list rate
  ├─ optional business destination postcode for PostNord island/ferry surcharge
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

## Data boundary

```text
src/data/finlandTariffData.ts
  ├─ official tariff bands
  ├─ effective / snapshot constants
  ├─ carrier source URLs
  └─ PostNord island/ferry postcode set
            ↓
src/domain/finlandTariffs.ts
  ├─ eligibility rules
  ├─ dimensional / volumetric calculations
  ├─ surcharge composition
  └─ normalized Quote[]
```

Tariff refreshes should normally modify the data module first. Domain logic changes require separate tests because they change how published rules are interpreted.

## Accuracy model

Each result is classified as one of:

- **exact-public** — directly calculable from a current public consumer tariff;
- **exact-list** — directly calculable from a published business/list tariff, before any customer-specific discount;
- **live-quote** — official live/account quote required because material variables are dynamic or account-specific;
- **inactive** — service is currently not offered from Finland.

This is a core domain distinction, not just a UI badge.

## Carrier rules

### Posti

Rotation-aware size matching selects the smallest eligible XXS–XL product and enforces Posti's 100 g minimum plus distinct XXS vs regular-parcel minimum dimensions. XXL uses the official longest-side and length-plus-girth constraint. Selecting the Åland route switches to the separate Posti Åland price table without collecting an exact postal code.

### Matkahuolto

Pakettitutka prices only the current consumer sizes whose prices are directly exposed by the official public page. Larger services remain visible in the provider directory rather than being filled from stale historic tariffs.

### GLS

GLSparcel.fi is modeled by weight band. Pickup +€20 and door delivery +€5 are applied from the public tariff. Door delivery is forced above 15 kg. Dimension and girth limits are evaluated before quoting.

### PostNord

PostNord contract list pricing uses:

```text
volume m³ × 280 kg
max(actual, volumetric)
→ published weight band
→ current parcel fuel surcharge on freight only
→ possible special handling
→ Finnish VAT
```

Only nationwide domestic Locker and Service Point products are auto-calculated. An optional destination postcode is checked against PostNord's official Finnish island/ferry surcharge list; matching postcodes add the published €11.63 fee before VAT. Pakettitutka does not guess PostNord Home zone/rural/island pricing without the full official postal-code surcharge model.

## Data freshness

Tariffs are versioned in source with explicit effective/check dates. Dynamic providers remain live-quote-only unless their changing surcharge inputs are modeled explicitly.

## Quality strategy

Unit tests cover:
- route scope and Åland pricing;
- decimal input;
- rotation-aware box matching;
- Posti minimum weight/dimension boundaries for XXS and regular parcels;
- Posti Åland tariff;
- GLS mandatory home delivery;
- PostNord volumetric weight;
- PostNord fuel + VAT pipeline;
- PostNord island/ferry postcode surcharge detection;
- exclusion of additional-service fees from the fuel-surcharge base.

Browser tests cover:
- consumer comparison;
- business/list-rate mode;
- stale result invalidation on input edit;
- validation;
- Åland route without postcode/GPS;
- accessibility;
- mobile overflow.
