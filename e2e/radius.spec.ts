import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PHOTON_ROUTE = "https://photon.komoot.io/api/**";
const OPEN_METEO_ROUTE = "https://geocoding-api.open-meteo.com/v1/search**";

function photonFeature(
  name: string,
  longitude: number,
  latitude: number,
  country = "Finland",
  countrycode = "FI",
  id = 1,
) {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [longitude, latitude] },
    properties: {
      osm_type: "N",
      osm_id: id,
      name,
      country,
      countrycode,
    },
  };
}

async function mockPhoton(page: Page) {
  await page.route(PHOTON_ROUTE, (route) => {
    const query = new URL(route.request().url()).searchParams.get("q")?.toLowerCase() ?? "";

    if (query.includes("turku")) {
      return route.fulfill({
        json: {
          features: [
            photonFeature("Turku", 22.2666, 60.4518, "Finland", "FI", 1),
            photonFeature("Turku Harbour", 22.2176, 60.4356, "Finland", "FI", 2),
          ],
        },
      });
    }

    if (query.includes("helsinki")) {
      return route.fulfill({
        json: {
          features: [
            photonFeature("Helsinki Airport", 24.9633, 60.3172, "Finland", "FI", 3),
          ],
        },
      });
    }

    return route.fulfill({ json: { features: [] } });
  });
}

test.beforeEach(async ({ page }) => {
  await mockPhoton(page);
  await page.goto("/");
});

test("plans a global route from human-readable place names", async ({ page }) => {
  await page.locator('[data-test-id="fromQuery"]').fill("Turku, Finland");
  await page.locator('[data-test-id="toQuery"]').fill("Helsinki Airport, Finland");
  await page.locator('[data-test-id="planDelivery"]').click();

  await expect(page.getByText("Planning estimate")).toBeVisible();
  await expect(page.locator('[data-test-id="estimateRange"]')).toBeVisible();
  await expect(page.locator('[data-test-id="roadDistance"]')).toContainText("km");
  await expect(page.getByLabel("Resolved from resolved place")).toBeVisible();
});

test("invalidates a resolved route as soon as a place query changes", async ({ page }) => {
  await page.locator('[data-test-id="fromQuery"]').fill("Turku, Finland");
  await page.locator('[data-test-id="toQuery"]').fill("Helsinki Airport, Finland");
  await page.locator('[data-test-id="planDelivery"]').click();
  await expect(page.getByText("Planning estimate")).toBeVisible();

  await page.locator('[data-test-id="fromQuery"]').fill("Tampere, Finland");

  await expect(page.getByText("Planning estimate")).toHaveCount(0);
});

test("falls back to Open-Meteo locality search when Photon is unavailable", async ({ page }) => {
  await page.unroute(PHOTON_ROUTE);
  await page.route(PHOTON_ROUTE, (route) => route.fulfill({ status: 503, json: {} }));
  await page.route(OPEN_METEO_ROUTE, (route) => {
    const query = new URL(route.request().url()).searchParams.get("name")?.toLowerCase() ?? "";
    return route.fulfill({
      json: {
        results: query.includes("turku")
          ? [
              {
                id: 633679,
                name: "Turku",
                latitude: 60.45148,
                longitude: 22.26869,
                admin1: "Southwest Finland",
                country: "Finland",
                country_code: "FI",
              },
            ]
          : [
              {
                id: 658225,
                name: "Helsinki",
                latitude: 60.16952,
                longitude: 24.93545,
                admin1: "Uusimaa",
                country: "Finland",
                country_code: "FI",
              },
            ],
      },
    });
  });

  await page.locator('[data-test-id="fromQuery"]').fill("Turku");
  await page.locator('[data-test-id="toQuery"]').fill("Helsinki");
  await page.locator('[data-test-id="planDelivery"]').click();

  await expect(page.getByText("Planning estimate")).toBeVisible();
  await expect(page.getByText("Open-Meteo / GeoNames").first()).toBeVisible();
});

test("validates route text before calling geocoding providers", async ({ page }) => {
  let providerCalls = 0;
  page.on("request", (request) => {
    if (
      request.url().includes("photon.komoot.io") ||
      request.url().includes("geocoding-api.open-meteo.com")
    ) {
      providerCalls += 1;
    }
  });

  await page.locator('[data-test-id="fromQuery"]').fill("T");
  await page.locator('[data-test-id="toQuery"]').fill("");
  await page.locator('[data-test-id="planDelivery"]').click();

  await expect(
    page.getByText("Enter a place, address, landmark, city, or postal code.").first(),
  ).toBeVisible();
  expect(providerCalls).toBe(0);
});

test("has no serious or critical WCAG A/AA violations in the result state", async ({ page }) => {
  await page.locator('[data-test-id="fromQuery"]').fill("Turku, Finland");
  await page.locator('[data-test-id="toQuery"]').fill("Helsinki Airport, Finland");
  await page.locator('[data-test-id="planDelivery"]').click();
  await expect(page.getByText("Planning estimate")).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(
    results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    ),
  ).toEqual([]);
});

test("does not overflow horizontally on the active viewport", async ({ page }) => {
  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewportWidth);
});
