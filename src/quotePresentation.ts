import type { Quote } from "./domain/finlandTariffs";
import type { Lang } from "./i18n";

export function quoteServiceLabel(quote: Quote, lang: Lang): string {
  if (lang === "en") return quote.service;

  if (quote.id.startsWith("posti-")) {
    const size = quote.id.replace("posti-", "").toUpperCase();
    return `${size}-paketti · verkossa / OmaPosti`;
  }

  if (quote.id.startsWith("matkahuolto-")) {
    const size = quote.id.replace("matkahuolto-", "").toUpperCase();
    return `${size}-paketti · Paketit-sovellus / verkossa`;
  }

  if (quote.id === "gls-parcel") {
    return quote.service.includes("door delivery")
      ? "GLSparcel.fi · kotiinkuljetus"
      : "GLSparcel.fi · noutopiste / pakettiautomaatti";
  }

  if (quote.id === "postnord-locker") {
    return "PostNord Automaatti · B2C-listahinta";
  }

  if (quote.id === "postnord-service-point") {
    return "PostNord Palvelupiste · B2C-listahinta";
  }

  return quote.service;
}

export function quoteEtaLabel(quote: Quote, lang: Lang): string {
  if (lang === "en") return quote.deliveryTime;

  if (quote.id === "posti-xxs") return "Noin 2–3 arkipäivää";
  if (quote.id.startsWith("posti-") || quote.id.startsWith("matkahuolto-")) {
    return "1–3 arkipäivää";
  }
  if (quote.id.startsWith("postnord-")) return "1–2 arkipäivää";
  if (quote.id === "gls-parcel") return "Toimitusaika riippuu palvelusta";

  return quote.deliveryTime;
}

export function quoteExplanationLabel(quote: Quote, lang: Lang): string {
  if (lang === "en") return quote.explanation;

  if (quote.id.startsWith("posti-")) {
    if (quote.id === "posti-xxl") {
      return "Virallinen XXL-hinta. Soveltuvuus tarkistetaan Postin pisimmän sivun ja pituus + ympärysmitta -rajoilla.";
    }
    return quote.explanation.includes("Åland")
      ? "Postin virallinen verkkohinta Ahvenanmaalle tai Ahvenanmaalta pienimmälle sopivalle pakettikoolle."
      : "Postin virallinen verkko-/OmaPosti-hinta pienimmälle sopivalle kotimaan pakettikoolle.";
  }

  if (quote.id.startsWith("matkahuolto-")) {
    return "Matkahuollon ajantasainen julkinen kuluttajahinta pienimmälle sopivalle koolle, jonka hinta on julkaistu kotimaan pakettisivulla.";
  }

  if (quote.id === "gls-parcel") {
    return "GLSparcel.fi-palvelun virallinen perushinta sekä valitut nouto- ja kotiinkuljetuslisät.";
  }

  if (quote.id.startsWith("postnord-")) {
    return "Laskettu PostNordin vuoden 2026 listahinnasta käyttäen laskutuspainoa, voimassa olevaa polttoainelisää ja Suomen ALV:tä. Reittikohtainen saari-/lauttalisä huomioidaan, kun kohdepostinumero on annettu. Sopimushintasi voi poiketa.";
  }

  return quote.explanation;
}

export function quoteSourceLabel(quote: Quote, lang: Lang): string {
  if (lang === "en") return quote.sourceLabel;

  if (quote.provider === "Posti") return "Postin pakettihinnasto";
  if (quote.provider === "Matkahuolto") return "Matkahuollon kotimaan paketit";
  if (quote.provider === "GLS Finland") return "GLS Finlandin kuluttajahinnasto";
  if (quote.provider === "PostNord") return "PostNordin vuoden 2026 palveluhinnasto";

  return quote.sourceLabel;
}

export function quoteEffectiveDateLabel(quote: Quote, lang: Lang): string {
  if (lang === "en") return quote.effectiveDate;
  return quote.effectiveDate.replace(" fuel surcharge", " polttoainelisä");
}

export function localizeQuoteDetail(detail: string, lang: Lang): string {
  if (lang === "en") return detail;

  return detail
    .replace(/^Selected size:/, "Valittu koko:")
    .replace(/^Weight limit:/, "Painoraja:")
    .replace(/^Max weight:/, "Enimmäispaino:")
    .replace(/^Official published price:/, "Virallinen julkaistu hinta:")
    .replace(/^Base band: up to/, "Perushintaluokka: enintään")
    .replace(/^Actual weight:/, "Todellinen paino:")
    .replace(/^Volumetric weight:/, "Tilavuuspaino:")
    .replace(/^Chargeable weight:/, "Laskutuspaino:")
    .replace(/^Base freight:/, "Perusrahti:")
    .replace(/^Fuel surcharge:/, "Polttoainelisä:")
    .replace(/^VAT 25\.5%:/, "ALV 25,5 %:")
    .replace("Åland tariff applied", "Ahvenanmaan hinnastoa sovellettu")
    .replace("Mainland Finland tariff", "Manner-Suomen hinnasto")
    .replace("Longest side ≤ 200 cm", "Pisin sivu ≤ 200 cm")
    .replace("Longest side + circumference ≤ 300 cm", "Pisin sivu + ympärysmitta ≤ 300 cm")
    .replace("Larger consumer sizes exist; their current prices are intentionally not guessed.", "Suurempia kuluttajakokoja on olemassa; niiden ajantasaisia hintoja ei arvata ilman julkaistua lähdettä.")
    .replace("Sender pickup: +€20.00", "Nouto lähettäjältä: +20,00 €")
    .replace("Sender drops parcel at Matkahuolto point", "Lähettäjä vie paketin Matkahuollon pisteeseen")
    .replace("Door delivery: +€5.00", "Kotiinkuljetus: +5,00 €")
    .replace("Pickup point / locker delivery", "Noutopiste- / automaattitoimitus")
    .replace("Door delivery is mandatory above 15 kg", "Kotiinkuljetus on pakollinen yli 15 kg:n lähetyksille")
    .replace("Door delivery optional", "Kotiinkuljetus on valinnainen")
    .replace("Special handling: +€4.60 excl. VAT", "Erityiskäsittely: +4,60 € ilman ALV:tä")
    .replace("No special-handling fee triggered", "Erityiskäsittelymaksua ei sovelleta")
    .replace("Island/ferry surcharge: +€11.63 excl. VAT", "Saari-/lauttalisä: +11,63 € ilman ALV:tä")
    .replace("No PostNord island/ferry surcharge for the supplied destination postcode", "Annetulle kohdepostinumerolle ei tule PostNordin saari-/lauttalisää")
    .replace("Island/ferry surcharge not checked — add a destination postcode for location-specific verification", "Saari-/lauttalisää ei tarkistettu — lisää kohdepostinumero reittikohtaista tarkistusta varten")
    .replace("Fuel surcharge", "Polttoainelisä")
    .replace("of freight", "rahdituksesta")
    .replace("excl. VAT", "ilman ALV:tä");
}
