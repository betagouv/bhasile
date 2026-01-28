import { Page } from "@playwright/test";

import { parseAddress } from "../shared-utils";

export async function mockAddressApi(page: Page, fullAddress: string) {
  await page.route("https://data.geopf.fr/geocodage/**", async (route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get("q")?.trim();
    const addressSuggestion = buildAddressSuggestion(query || fullAddress);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ features: [addressSuggestion] }),
    });
  });
}

const buildAddressSuggestion = (fullAddress: string) => {
  const parsed = parseAddress(fullAddress);
  const [housenumber, ...streetParts] = parsed.street.split(/\s+/);

  return {
    properties: {
      label: fullAddress,
      housenumber,
      street: streetParts.length > 0 ? streetParts.join(" ") : parsed.street,
      postcode: parsed.postalCode,
      city: parsed.city,
    },
    geometry: {
      coordinates: [2.3522, 48.8566],
    },
  };
};
