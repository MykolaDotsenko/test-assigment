export interface BoxTariffData {
  name: string;
  max: [number, number, number];
  maxWeightKg: number;
  min?: [number, number, number];
  minWeightKg?: number;
  priceCents: number;
  alandPriceCents?: number;
}

export interface WeightBandData {
  maxKg: number;
  cents: number;
}

export const VAT_RATE = 0.255;
export const POSTNORD_FUEL_SURCHARGE = 0.104;
export const TARIFF_SNAPSHOT_DATE = "2026-09-20";
export const POSTNORD_ISLAND_FERRY_SURCHARGE_CENTS = 1163;

export const POSTNORD_FINLAND_ISLAND_FERRY_POSTCODES = new Set([
  "00190", "07370", "10270", "21650", "21660", "21661", "21670", "21680",
  "21710", "21720", "21740", "21750", "21760", "21770", "23390", "25910",
  "25940", "25950", "25960", "56350", "65800", "65870", "65920", "65930",
  "65970", "66220", "83910", "90480",
]);

export const POSTI_URL = "https://www.posti.fi/en/sending/parcels/package-price-lists";
export const MATKAHUOLTO_URL = "https://www.matkahuolto.fi/packages/domestic-parcels";
export const GLS_URL = "https://gls-group.com/FI/en/ship-with-gls/Consumers-Small-Businesses/";
export const POSTNORD_URL =
  "https://www.postnord.fi/siteassets/pdf/hinnastot/online_hinnastoliite_2026-02-01.pdf";
export const FEDEX_URL = "https://www.fedex.com/en-fi/shipping/rates/fedex-rates.html";
export const UPS_URL = "https://www.ups.com/fi/en/support/shipping-support/shipping-costs-rates";
export const DHL_URL = "https://www.dhl.com/fi-en/home/express.html";
export const DSV_URL =
  "https://www.dsv.com/fi-fi/palvelumme/kuljetusmuodot/maantiekuljetukset/rahtilisat/polttoainelisat";
export const BRING_URL = "https://www.bring.fi/";
export const BUDBEE_URL = "https://www.instabee.com/";
export const KAUKOKIITO_URL = "https://www.kaukokiito.fi/en/";
export const JETPAK_URL = "https://jetpak.com/fi/";
export const DHL_FREIGHT_URL =
  "https://www.dhl.com/fi-en/home/freight/help-center-for-european-road-and-rail/dhl-freight-surcharges.html";

export const POSTI_BOXES: BoxTariffData[] = [
  {
    name: "XXS",
    max: [3, 25, 35],
    maxWeightKg: 2,
    min: [1, 15, 15],
    minWeightKg: 0.1,
    priceCents: 790,
  },
  { name: "S", max: [11, 32, 42], maxWeightKg: 25, min: [1, 15, 25], minWeightKg: 0.1, priceCents: 990, alandPriceCents: 1490 },
  { name: "M", max: [19, 36, 60], maxWeightKg: 25, min: [1, 15, 25], minWeightKg: 0.1, priceCents: 1190, alandPriceCents: 1690 },
  { name: "L", max: [36, 37, 60], maxWeightKg: 25, min: [1, 15, 25], minWeightKg: 0.1, priceCents: 1690, alandPriceCents: 2090 },
  { name: "XL", max: [40, 60, 100], maxWeightKg: 25, min: [1, 15, 25], minWeightKg: 0.1, priceCents: 2290, alandPriceCents: 2690 },
];

export const MATKAHUOLTO_PUBLIC_BOXES: BoxTariffData[] = [
  { name: "XXS", max: [3, 25, 40], maxWeightKg: 30, priceCents: 590 },
  { name: "S", max: [10, 40, 55], maxWeightKg: 30, priceCents: 880 },
  { name: "M", max: [20, 40, 55], maxWeightKg: 30, priceCents: 1180 },
];

export const POSTNORD_LOCKER_BANDS: WeightBandData[] = [
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

export const POSTNORD_SERVICE_POINT_BANDS: WeightBandData[] = [
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
