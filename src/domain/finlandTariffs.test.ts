import { describe, expect, it } from "vitest";
import {
  calculateQuotes,
  isFinnishPostalCode,
  parsePositiveNumber,
  POSTNORD_FUEL_SURCHARGE,
  VAT_RATE,
  type ParcelInput,
} from "./finlandTariffs";

const base: ParcelInput = {
  fromPostalCode: "20100",
  toPostalCode: "00100",
  weightKg: 1,
  lengthCm: 20,
  widthCm: 15,
  heightCm: 5,
  audience: "consumer",
  glsPickup: false,
  glsHomeDelivery: false,
};

describe("input parsing", () => {
  it("accepts Finnish postal-code shape and decimal commas", () => {
    expect(isFinnishPostalCode("20100")).toBe(true);
    expect(isFinnishPostalCode("2010")).toBe(false);
    expect(parsePositiveNumber("1,25")).toBe(1.25);
  });
});

describe("consumer quotes", () => {
  it("selects the smallest fitting official Posti and Matkahuolto sizes", () => {
    const quotes = calculateQuotes(base);
    const matkahuolto = quotes.find((quote) => quote.provider === "Matkahuolto");
    const posti = quotes.find((quote) => quote.provider === "Posti");

    expect(matkahuolto?.service).toContain("S parcel");
    expect(matkahuolto?.priceCents).toBe(880);
    expect(posti?.service).toContain("S parcel");
    expect(posti?.priceCents).toBe(990);
  });

  it("rotates dimensions when checking a fixed-size product", () => {
    const quotes = calculateQuotes({ ...base, lengthCm: 55, widthCm: 10, heightCm: 40 });
    expect(quotes.find((quote) => quote.provider === "Matkahuolto")?.service).toContain("S parcel");
  });

  it("applies GLS pickup and mandatory home delivery over 15 kg", () => {
    const quotes = calculateQuotes({
      ...base,
      weightKg: 20,
      lengthCm: 50,
      widthCm: 40,
      heightCm: 30,
      glsPickup: true,
    });

    const gls = quotes.find((quote) => quote.provider === "GLS Finland");
    expect(gls?.priceCents).toBe(10400);
    expect(gls?.details.join(" ")).toContain("mandatory");
  });

  it("uses Posti's Åland table instead of mainland pricing", () => {
    const quotes = calculateQuotes({ ...base, toPostalCode: "22100" });
    const posti = quotes.find((quote) => quote.provider === "Posti");
    expect(posti?.priceCents).toBe(1490);
    expect(quotes.some((quote) => quote.provider === "GLS Finland")).toBe(false);
  });
});

describe("PostNord contract pricing", () => {
  it("uses volumetric weight when it exceeds actual weight", () => {
    const input: ParcelInput = {
      ...base,
      audience: "business",
      weightKg: 1,
      lengthCm: 50,
      widthCm: 40,
      heightCm: 30,
    };

    const quote = calculateQuotes(input).find((item) => item.id === "postnord-service-point");
    expect(quote).toBeDefined();
    expect(quote?.details.join(" ")).toContain("16.80 kg");
  });

  it("adds the published September fuel surcharge and Finnish VAT", () => {
    expect(POSTNORD_FUEL_SURCHARGE).toBe(0.104);
    expect(VAT_RATE).toBe(0.255);

    const quote = calculateQuotes({ ...base, audience: "business" }).find(
      (item) => item.id === "postnord-locker",
    );
    expect(quote?.accuracy).toBe("exact-list");
    expect(quote?.priceCents).toBeGreaterThan(490);
  });
});
