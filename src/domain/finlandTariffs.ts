export type Audience = "consumer" | "business";
export type Accuracy = "exact-public" | "exact-list" | "live-quote" | "inactive";

export interface ParcelInput {
  fromPostalCode: string;
  toPostalCode: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  audience: Audience;
  glsPickup: boolean;
  glsHomeDelivery: boolean;
}

export interface Quote {
  id: string;
  provider: string;
  service: string;
  audience: Audience;
  priceCents: number | null;
  accuracy: Accuracy;
  deliveryTime: string;
  explanation: string;
  sourceLabel: string;
  sourceUrl: string;
  effectiveDate: string;
  details: string[];
}

export interface ProviderDirectoryEntry {
  provider: string;
  scope: string;
  audience: "consumer" | "business" | "both";
  status: "calculated" | "live-quote" | "inactive";
  tariffSummary: string;
  sourceUrl: string;
  sourceLabel: string;
  freshness: string;
}

export const VAT_RATE = 0.255;
export const POSTNORD_FUEL_SURCHARGE = 0.104;
export const TARIFF_SNAPSHOT_DATE = "2026-09-20";

const POSTI_URL = "https://www.posti.fi/en/sending/parcels/package-price-lists";
const MATKAHUOLTO_URL = "https://www.matkahuolto.fi/packages/domestic-parcels";
const GLS_URL = "https://gls-group.com/FI/en/ship-with-gls/Consumers-Small-Businesses/";
const POSTNORD_URL =
  "https://www.postnord.fi/siteassets/pdf/hinnastot/online_hinnastoliite_2026-02-01.pdf";
const FEDEX_URL = "https://www.fedex.com/en-fi/shipping/rates/fedex-rates.html";
const UPS_URL = "https://www.ups.com/fi/en/support/shipping-support/shipping-costs-rates";
const DHL_URL = "https://www.dhl.com/fi-en/home/express.html";
const DSV_URL =
  "https://www.dsv.com/fi-fi/palvelumme/kuljetusmuodot/maantiekuljetukset/rahtilisat/polttoainelisat";
const BRING_URL = "https://www.bring.fi/";

interface BoxTariff {
  name: string;
  max: [number, number, number];
  maxWeightKg: number;
  priceCents: number;
  alandPriceCents?: number;
}

const POSTI_BOXES: BoxTariff[] = [
  { name: "XXS", max: [3, 25, 35], maxWeightKg: 2, priceCents: 790 },
  { name: "S", max: [11, 32, 42], maxWeightKg: 25, priceCents: 990, alandPriceCents: 1490 },
  { name: "M", max: [19, 36, 60], maxWeightKg: 25, priceCents: 1190, alandPriceCents: 1690 },
  { name: "L", max: [36, 37, 60], maxWeightKg: 25, priceCents: 1690, alandPriceCents: 2090 },
  { name: "XL", max: [40, 60, 100], maxWeightKg: 25, priceCents: 2290, alandPriceCents: 2690 },
];

const MATKAHUOLTO_PUBLIC_BOXES: BoxTariff[] = [
  { name: "XXS", max: [3, 25, 40], maxWeightKg: 30, priceCents: 590 },
  { name: "S", max: [10, 40, 55], maxWeightKg: 30, priceCents: 880 },
  { name: "M", max: [20, 40, 55], maxWeightKg: 30, priceCents: 1180 },
];

interface WeightBand {
  maxKg: number;
  cents: number;
}

const POSTNORD_LOCKER_BANDS: WeightBand[] = [
  { maxKg: 0.25, cents: 490 },
  { maxKg: 0.5, cents: 490 },
  { maxKg: 1, cents: 490 },
  { maxKg: 2, cents: 537 },
  { maxKg: 3, cents: 537 },
  { maxKg: 5, cents: 548 },
  { maxKg: 10, cents: 558 },
  { maxKg: 15, cents: 593 },
  { maxKg: 20, cents: 593 },
];

const POSTNORD_SERVICE_POINT_BANDS: WeightBand[] = [
  { maxKg: 0.25, cents: 510 },
  { maxKg: 0.5, cents: 510 },
  { maxKg: 1, cents: 510 },
  { maxKg: 2, cents: 558 },
  { maxKg: 3, cents: 568 },
  { maxKg: 5, cents: 568 },
  { maxKg: 10, cents: 578 },
  { maxKg: 15, cents: 593 },
  { maxKg: 20, cents: 593 },
  { maxKg: 25, cents: 603 },
  { maxKg: 30, cents: 619 },
];

function sortedDimensions(input: ParcelInput): [number, number, number] {
  return [input.lengthCm, input.widthCm, input.heightCm].sort((a, b) => a - b) as [
    number,
    number,
    number,
  ];
}

function fitsRotatableBox(input: ParcelInput, box: BoxTariff): boolean {
  if (input.weightKg > box.maxWeightKg) return false;
  const parcel = sortedDimensions(input);
  const limits = [...box.max].sort((a, b) => a - b);
  return parcel.every((dimension, index) => dimension <= limits[index]);
}

function longestAndGirth(input: ParcelInput): { longest: number; lengthPlusGirth: number } {
  const dimensions = [input.lengthCm, input.widthCm, input.heightCm].sort((a, b) => b - a);
  const [longest, second, third] = dimensions;
  return {
    longest,
    lengthPlusGirth: longest + 2 * (second + third),
  };
}

function isAland(postalCode: string): boolean {
  return /^22\d{3}$/.test(postalCode);
}

function quotePosti(input: ParcelInput): Quote | null {
  const aland = isAland(input.fromPostalCode) || isAland(input.toPostalCode);

  for (const box of POSTI_BOXES) {
    if (!fitsRotatableBox(input, box)) continue;
    if (aland && box.name === "XXS") continue;

    const priceCents = aland ? box.alandPriceCents ?? null : box.priceCents;
    if (priceCents === null) continue;

    return {
      id: `posti-${box.name.toLowerCase()}`,
      provider: "Posti",
      service: `${box.name} parcel · online / OmaPosti`,
      audience: "consumer",
      priceCents,
      accuracy: "exact-public",
      deliveryTime: "Domestic parcel service",
      explanation: aland
        ? "Official Posti online price to/from Åland for the smallest fitting parcel size."
        : "Official Posti online/OmaPosti domestic price for the smallest fitting parcel size.",
      sourceLabel: "Posti parcel price list",
      sourceUrl: POSTI_URL,
      effectiveDate: "2026-06-02",
      details: [
        `Selected size: ${box.name}`,
        `Weight limit: ${box.maxWeightKg} kg`,
        aland ? "Åland tariff applied" : "Mainland Finland tariff",
      ],
    };
  }

  const { longest, lengthPlusGirth } = longestAndGirth(input);
  if (input.weightKg <= 25 && longest <= 200 && lengthPlusGirth <= 300) {
    return {
      id: "posti-xxl",
      provider: "Posti",
      service: "XXL parcel · online / OmaPosti",
      audience: "consumer",
      priceCents: aland ? 4890 : 4490,
      accuracy: "exact-public",
      deliveryTime: "Domestic parcel service",
      explanation:
        "Official XXL price. Eligibility is checked using Posti's longest-side and length-plus-girth limits.",
      sourceLabel: "Posti parcel price list",
      sourceUrl: POSTI_URL,
      effectiveDate: "2026-06-02",
      details: [
        "Max weight: 25 kg",
        "Longest side ≤ 200 cm",
        "Longest side + circumference ≤ 300 cm",
        aland ? "Åland tariff applied" : "Mainland Finland tariff",
      ],
    };
  }

  return null;
}

function quoteMatkahuolto(input: ParcelInput): Quote | null {
  if (isAland(input.fromPostalCode) || isAland(input.toPostalCode)) return null;

  for (const box of MATKAHUOLTO_PUBLIC_BOXES) {
    if (!fitsRotatableBox(input, box)) continue;
    return {
      id: `matkahuolto-${box.name.toLowerCase()}`,
      provider: "Matkahuolto",
      service: `${box.name} parcel · Paketit app / online`,
      audience: "consumer",
      priceCents: box.priceCents,
      accuracy: "exact-public",
      deliveryTime: "1–3 business days",
      explanation:
        "Current public Matkahuolto consumer price for the smallest fitting size exposed on the official domestic parcel page.",
      sourceLabel: "Matkahuolto domestic parcels",
      sourceUrl: MATKAHUOLTO_URL,
      effectiveDate: TARIFF_SNAPSHOT_DATE,
      details: [
        `Selected size: ${box.name}`,
        `Official published price: €${(box.priceCents / 100).toFixed(2)}`,
        "Larger consumer sizes exist; their current prices are intentionally not guessed.",
      ],
    };
  }

  return null;
}

function quoteGls(input: ParcelInput): Quote | null {
  if (isAland(input.fromPostalCode) || isAland(input.toPostalCode)) return null;
  const { longest, lengthPlusGirth } = longestAndGirth(input);
  const dimensions = [input.lengthCm, input.widthCm, input.heightCm].sort((a, b) => b - a);
  const [, second, third] = dimensions;

  if (
    input.weightKg > 25 ||
    longest > 200 ||
    second > 80 ||
    third > 60 ||
    lengthPlusGirth > 300
  ) {
    return null;
  }

  let baseCents: number;
  if (input.weightKg <= 1) baseCents = 2400;
  else if (input.weightKg <= 3) baseCents = 2900;
  else if (input.weightKg <= 15) baseCents = 5900;
  else baseCents = 7900;

  const homeRequired = input.weightKg > 15;
  const home = homeRequired || input.glsHomeDelivery;
  const pickupFee = input.glsPickup ? 2000 : 0;
  const homeFee = home ? 500 : 0;
  const total = baseCents + pickupFee + homeFee;

  return {
    id: "gls-parcel",
    provider: "GLS Finland",
    service: home ? "GLSparcel.fi · door delivery" : "GLSparcel.fi · pickup point / locker",
    audience: "consumer",
    priceCents: total,
    accuracy: "exact-public",
    deliveryTime: "GLS domestic parcel service",
    explanation:
      "Official GLSparcel.fi basic tariff with the selected pickup and door-delivery surcharges applied.",
    sourceLabel: "GLS Finland consumer price list",
    sourceUrl: GLS_URL,
    effectiveDate: TARIFF_SNAPSHOT_DATE,
    details: [
      `Base band: up to ${input.weightKg <= 1 ? "1" : input.weightKg <= 3 ? "3" : input.weightKg <= 15 ? "15" : "25"} kg`,
      input.glsPickup ? "Sender pickup: +€20.00" : "Sender drops parcel at Matkahuolto point",
      home ? "Door delivery: +€5.00" : "Pickup point / locker delivery",
      homeRequired ? "Door delivery is mandatory above 15 kg" : "Door delivery optional",
    ],
  };
}

function postNordChargeableWeight(input: ParcelInput): number {
  const volumeM3 = (input.lengthCm * input.widthCm * input.heightCm) / 1_000_000;
  return Math.max(input.weightKg, volumeM3 * 280);
}

function bandPrice(weight: number, bands: WeightBand[]): number | null {
  return bands.find((band) => weight <= band.maxKg)?.cents ?? null;
}

function grossPostNordPrice(baseCents: number): {
  baseCents: number;
  fuelCents: number;
  vatCents: number;
  totalCents: number;
} {
  const fuelCents = Math.round(baseCents * POSTNORD_FUEL_SURCHARGE);
  const taxable = baseCents + fuelCents;
  const vatCents = Math.round(taxable * VAT_RATE);
  return { baseCents, fuelCents, vatCents, totalCents: taxable + vatCents };
}

function quotePostNord(
  input: ParcelInput,
  service: "locker" | "service-point",
): Quote | null {
  if (input.audience !== "business") return null;
  if (isAland(input.fromPostalCode) || isAland(input.toPostalCode)) return null;
  if (input.weightKg < 0.15) return null;

  const { longest, lengthPlusGirth } = longestAndGirth(input);
  const sorted = sortedDimensions(input);

  const eligible =
    service === "locker"
      ? input.weightKg <= 20 &&
        sorted[0] <= 42 &&
        sorted[1] <= 49 &&
        sorted[2] <= 60
      : input.weightKg <= 30 && longest <= 150 && lengthPlusGirth <= 300;

  if (!eligible) return null;

  const chargeableWeight = postNordChargeableWeight(input);
  const bands =
    service === "locker" ? POSTNORD_LOCKER_BANDS : POSTNORD_SERVICE_POINT_BANDS;
  const baseCents = bandPrice(chargeableWeight, bands);
  if (baseCents === null) return null;

  const specialHandling =
    longest > 120 || [input.lengthCm, input.widthCm, input.heightCm].filter((v) => v > 60).length >= 2;
  const specialHandlingCents = specialHandling ? 460 : 0;
  const priced = grossPostNordPrice(baseCents + specialHandlingCents);

  return {
    id: `postnord-${service}`,
    provider: "PostNord",
    service:
      service === "locker"
        ? "PostNord Automaatti · B2C contract list"
        : "PostNord Palvelupiste · B2C contract list",
    audience: "business",
    priceCents: priced.totalCents,
    accuracy: "exact-list",
    deliveryTime: "Contract parcel service",
    explanation:
      "Calculated from PostNord's 2026 list rate using chargeable weight, current September parcel fuel surcharge and Finnish VAT. Your negotiated contract rate may differ.",
    sourceLabel: "PostNord 2026 service price list",
    sourceUrl: POSTNORD_URL,
    effectiveDate: "2026-09-01 fuel surcharge",
    details: [
      `Actual weight: ${input.weightKg.toFixed(2)} kg`,
      `Volumetric weight: ${((input.lengthCm * input.widthCm * input.heightCm) / 1_000_000 * 280).toFixed(2)} kg`,
      `Chargeable weight: ${chargeableWeight.toFixed(2)} kg`,
      `Base + eligible handling: €${((baseCents + specialHandlingCents) / 100).toFixed(2)} excl. VAT`,
      `Fuel surcharge: 10.4% (€${(priced.fuelCents / 100).toFixed(2)})`,
      `VAT 25.5%: €${(priced.vatCents / 100).toFixed(2)}`,
      specialHandling ? "Special handling +€4.60 excl. VAT included" : "No special-handling fee triggered",
    ],
  };
}

export function calculateQuotes(input: ParcelInput): Quote[] {
  const quotes: Quote[] = [
    quotePosti(input),
    quoteMatkahuolto(input),
    quoteGls(input),
    quotePostNord(input, "locker"),
    quotePostNord(input, "service-point"),
  ].filter((quote): quote is Quote => quote !== null);

  return quotes.sort((a, b) => (a.priceCents ?? Number.POSITIVE_INFINITY) - (b.priceCents ?? Number.POSITIVE_INFINITY));
}

export const PROVIDER_DIRECTORY: ProviderDirectoryEntry[] = [
  {
    provider: "Posti",
    scope: "Domestic consumer parcels",
    audience: "consumer",
    status: "calculated",
    tariffSummary: "XXS €7.90 · S €9.90 · M €11.90 · L €16.90 · XL €22.90 · XXL €44.90; separate Åland prices.",
    sourceUrl: POSTI_URL,
    sourceLabel: "Official parcel price list",
    freshness: "Prices from 2 Jun 2026",
  },
  {
    provider: "Matkahuolto",
    scope: "Domestic consumer parcels",
    audience: "consumer",
    status: "calculated",
    tariffSummary: "Official public current prices: XXS €5.90 · S €8.80 · M €11.80. Larger sizes are available, but Radius does not guess prices not exposed in the current public index.",
    sourceUrl: MATKAHUOLTO_URL,
    sourceLabel: "Official domestic parcel page",
    freshness: "Verified 20 Sep 2026",
  },
  {
    provider: "GLS Finland",
    scope: "Domestic / EU occasional shipping",
    audience: "both",
    status: "calculated",
    tariffSummary: "≤1 kg €24 · ≤3 kg €29 · ≤15 kg €59 · ≤25 kg €79; sender pickup +€20/shipment; door delivery +€5/parcel.",
    sourceUrl: GLS_URL,
    sourceLabel: "Official GLSparcel.fi basic tariff",
    freshness: "Verified 20 Sep 2026",
  },
  {
    provider: "PostNord",
    scope: "Domestic contract parcels",
    audience: "business",
    status: "calculated",
    tariffSummary: "Weight-band list rates excl. VAT + current fuel surcharge. Radius calculates Locker and Service Point using max(actual, 280 kg/m³ volumetric weight).",
    sourceUrl: POSTNORD_URL,
    sourceLabel: "Official 2026 service price list",
    freshness: "Fuel surcharge 10.4% from 1 Sep 2026",
  },
  {
    provider: "FedEx",
    scope: "Domestic express / international courier",
    audience: "business",
    status: "live-quote",
    tariffSummary: "2026 standard domestic list rates exist, but final price can include weekly fuel, extended-area and handling surcharges. Use FedEx live rate for billing-grade accuracy.",
    sourceUrl: FEDEX_URL,
    sourceLabel: "FedEx Finland rates & surcharges",
    freshness: "2026 list rates",
  },
  {
    provider: "UPS",
    scope: "Domestic / international courier",
    audience: "both",
    status: "live-quote",
    tariffSummary: "Rate guide plus fuel, extended/remote-area and demand surcharges. A Surge Emergency Fee applies on selected lanes from 20 Sep 2026.",
    sourceUrl: UPS_URL,
    sourceLabel: "UPS Finland shipping rates",
    freshness: "Verified 20 Sep 2026",
  },
  {
    provider: "DHL Express",
    scope: "Domestic / international express",
    audience: "both",
    status: "live-quote",
    tariffSummary: "Price depends on origin/destination, greater of actual or volumetric weight, service level and current optional surcharges.",
    sourceUrl: DHL_URL,
    sourceLabel: "DHL Express Finland",
    freshness: "2026 rates",
  },
  {
    provider: "DSV Parcel / Schenker",
    scope: "Business parcel and road logistics",
    audience: "business",
    status: "live-quote",
    tariffSummary: "Contract/spot pricing. Domestic parcel fuel surcharge is currently 16.86% from 16 Sep 2026; base freight is agreement-specific.",
    sourceUrl: DSV_URL,
    sourceLabel: "DSV Finland fuel surcharges",
    freshness: "16 Sep 2026",
  },
  {
    provider: "Bring",
    scope: "Former outbound/domestic service from Finland",
    audience: "business",
    status: "inactive",
    tariffSummary: "Bring states that shipments from Finland and domestic services in Finland are discontinued.",
    sourceUrl: BRING_URL,
    sourceLabel: "Bring Finland",
    freshness: "Current site status",
  },
];

export function formatPrice(cents: number | null): string {
  if (cents === null) return "Live quote";
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function parsePositiveNumber(raw: string): number | null {
  const value = Number(raw.trim().replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function isFinnishPostalCode(raw: string): boolean {
  return /^\d{5}$/.test(raw.trim());
}
