import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const STATIC_PAYLOAD = {
  venue_raw: {
    location: {
      coordinates: [24.93087, 60.17094],
    },
  },
};

const DYNAMIC_PAYLOAD = {
  venue_raw: {
    delivery_specs: {
      order_minimum_no_surcharge: 1_000,
      delivery_pricing: {
        base_price: 190,
        distance_ranges: [
          { min: 0, max: 500, a: 0, b: 0, flag: null },
          { min: 500, max: 1_000, a: 100, b: 1, flag: null },
          { min: 1_000, max: 0, a: 0, b: 0, flag: null },
        ],
      },
    },
  },
};

async function mockVenueApi(page: Page) {
  await page.route("**/home-assignment-api/v1/venues/**/static", (route) =>
    route.fulfill({ json: STATIC_PAYLOAD }),
  );
  await page.route("**/home-assignment-api/v1/venues/**/dynamic", (route) =>
    route.fulfill({ json: DYNAMIC_PAYLOAD }),
  );
}

test.beforeEach(async ({ page }) => {
  await mockVenueApi(page);
  await page.goto("/");
});

test("calculates and explains an available delivery quote", async ({ page }) => {
  await page.locator('[data-test-id="cartValue"]').fill("8.00");
  await page.locator('[data-test-id="userLatitude"]').fill("60.17094");
  await page.locator('[data-test-id="userLongitude"]').fill("24.93087");
  await page.locator('[data-test-id="calculateDeliveryPrice"]').click();

  await expect(page.getByText("Delivery available")).toBeVisible();
  await expect(page.locator('[data-test-id="smallOrderSurcharge"]')).toContainText("2.00");
  await expect(page.locator('[data-test-id="deliveryFee"]')).toContainText("1.90");
  await expect(page.locator('[data-test-id="totalPrice"]')).toContainText("11.90");
  await expect(page.getByText(/Add .*2\.00.* to the cart/)).toBeVisible();
});

test("keeps a valid quote distinct from outside-delivery-area state", async ({ page }) => {
  await page.locator('[data-test-id="cartValue"]').fill("20.00");
  await page.locator('[data-test-id="userLatitude"]').fill("60.19094");
  await page.locator('[data-test-id="userLongitude"]').fill("24.93087");
  await page.locator('[data-test-id="calculateDeliveryPrice"]').click();

  await expect(page.getByText("Outside delivery area")).toBeVisible();
  await expect(page.getByText("No delivery quote")).toBeVisible();
  await expect(page.getByText("Try a closer location.")).toBeVisible();
});

test("rejects over-precise money before calling the provider", async ({ page }) => {
  let providerCalls = 0;
  page.on("request", (request) => {
    if (request.url().includes("home-assignment-api")) providerCalls += 1;
  });

  await page.locator('[data-test-id="cartValue"]').fill("12.345");
  await page.locator('[data-test-id="calculateDeliveryPrice"]').click();

  await expect(page.getByText("Enter a non-negative EUR amount with at most two decimals.")).toBeVisible();
  expect(providerCalls).toBe(0);
});

test("has no serious or critical WCAG A/AA violations in the result state", async ({ page }) => {
  await page.locator('[data-test-id="calculateDeliveryPrice"]').click();
  await expect(page.getByText("Delivery available")).toBeVisible();

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
