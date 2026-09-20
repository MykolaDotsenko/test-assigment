import { describe, expect, it } from "vitest";
import type { Quote } from "./domain/finlandTariffs";
import {
  localizeQuoteDetail,
  quoteEtaLabel,
  quoteExplanationLabel,
  quoteServiceLabel,
  quoteSourceLabel,
} from "./quotePresentation";

const base: Quote = {
  id: "matkahuolto-s",
  provider: "Matkahuolto",
  service: "S parcel · Paketit app / online",
  audience: "consumer",
  priceCents: 880,
  accuracy: "exact-public",
  deliveryTime: "1–3 business days",
  explanation: "Current public Matkahuolto consumer price.",
  sourceLabel: "Matkahuolto domestic parcels",
  sourceUrl: "https://example.com",
  actionUrl: "https://example.com/send",
  effectiveDate: "2026-09-20",
  details: [],
};

describe("quote presentation localization", () => {
  it("keeps English domain presentation unchanged", () => {
    expect(quoteServiceLabel(base, "en")).toBe(base.service);
    expect(quoteEtaLabel(base, "en")).toBe(base.deliveryTime);
    expect(quoteSourceLabel(base, "en")).toBe(base.sourceLabel);
  });

  it("renders semantic Finnish service and ETA labels", () => {
    expect(quoteServiceLabel(base, "fi")).toBe("S-paketti · Paketit-sovellus / verkossa");
    expect(quoteEtaLabel(base, "fi")).toBe("1–3 arkipäivää");
    expect(quoteSourceLabel(base, "fi")).toBe("Matkahuollon kotimaan paketit");
    expect(quoteExplanationLabel(base, "fi")).toContain("Matkahuollon");
  });

  it("localizes technical tariff details without changing amounts", () => {
    expect(localizeQuoteDetail("Fuel surcharge: 10.4% of freight (€0.60)", "fi"))
      .toBe("Polttoainelisä: 10.4% rahdituksesta (€0.60)");
    expect(localizeQuoteDetail("Island/ferry surcharge: +€11.63 excl. VAT", "fi"))
      .toBe("Saari-/lauttalisä: +11,63 € ilman ALV:tä");
  });
});
