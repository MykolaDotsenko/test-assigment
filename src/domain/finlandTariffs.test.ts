import { describe, expect, it } from "vitest";
import {
  calculateQuotes,
  parsePositiveNumber,
  POSTNORD_FUEL_SURCHARGE,
  VAT_RATE,
  type ParcelInput,
} from "./finlandTariffs";

const base: ParcelInput = {
  route: "mainland",
  weightKg: 1,
  lengthCm: 20,
  widthCm: 15,
  heightCm: 5,
  audience: "consumer",
  glsPickup: false,
  glsHomeDelivery: false,
};

describe("input parsing", () => {
  it("accepts decimal commas for parcel measurements", () => {
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

  it("accepts the exact GLS girth boundary and rejects one centimetre over it", () => {
    const exact = calculateQuotes({
      ...base,
      weightKg: 1,
      lengthCm: 100,
      widthCm: 50,
      heightCm: 50,
    });
    const over = calculateQuotes({
      ...base,
      weightKg: 1,
      lengthCm: 101,
      widthCm: 50,
      heightCm: 50,
    });

    expect(exact.some((quote) => quote.provider === "GLS Finland")).toBe(true);
    expect(over.some((quote) => quote.provider === "GLS Finland")).toBe(false);
  });

  it("accepts Posti XXL exactly at its published longest-side and girth limits", () => {
    const exact = calculateQuotes({
      ...base,
      weightKg: 25,
      lengthCm: 200,
      widthCm: 25,
      heightCm: 25,
    });
    const overLongestSide = calculateQuotes({
      ...base,
      weightKg: 25,
      lengthCm: 201,
      widthCm: 24,
      heightCm: 24,
    });

    expect(exact.find((quote) => quote.provider === "Posti")?.service).toContain("XXL");
    expect(overLongestSide.some((quote) => quote.provider === "Posti")).toBe(false);
  });

  it("uses Posti's Åland table instead of mainland pricing", () => {
    const quotes = calculateQuotes({ ...base, route: "aland" });
    const posti = quotes.find((quote) => quote.provider === "Posti");
    expect(posti?.priceCents).toBe(1490);
    expect(quotes.some((quote) => quote.provider === "GLS Finland")).toBe(false);
  });
});

describe("PostNord contract pricing", () => {
  it("does not mix consumer tariffs into business/list-rate results", () => {
    const quotes = calculateQuotes({ ...base, audience: "business" });

    expect(quotes.length).toBeGreaterThan(0);
    expect(quotes.every((quote) => quote.audience === "business")).toBe(true);
    expect(quotes.some((quote) => quote.provider === "Posti")).toBe(false);
    expect(quotes.some((quote) => quote.provider === "Matkahuolto")).toBe(false);
    expect(quotes.some((quote) => quote.provider === "GLS Finland")).toBe(false);
  });

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

  it("excludes additional-service fees from the fuel-surcharge base", () => {
    const quote = calculateQuotes({
      ...base,
      audience: "business",
      weightKg: 5,
      lengthCm: 130,
      widthCm: 20,
      heightCm: 10,
    }).find((item) => item.id === "postnord-service-point");

    expect(quote?.priceCents).toBe(1378);
    expect(quote?.details.join(" ")).toContain("10.4% of freight (€0.60)");
    expect(quote?.details.join(" ")).toContain("Special handling: +€4.60");
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
