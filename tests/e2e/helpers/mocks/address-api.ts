import { Page } from "@playwright/test";

export async function mockAddressApi(page: Page, fullAddress: string) {
  await page.route("https://api-adresse.data.gouv.fr/**", async (route) => {
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
  const parts = fullAddress.trim().split(/\s+/);
  const postalCodeMatch = parts.find((part) => /^\d{5}$/.test(part));
  const postalCode = postalCodeMatch || "75001";
  const postalIndex = parts.findIndex((part) => part === postalCode);
  const city =
    postalIndex > -1 ? parts.slice(postalIndex + 1).join(" ") : "Paris";
  const street =
    postalIndex > -1 ? parts.slice(0, postalIndex).join(" ") : fullAddress;
  const [housenumber, ...streetParts] = street.split(/\s+/);
  const department = postalCode.startsWith("20")
    ? postalCode.substring(0, 3)
    : postalCode.substring(0, 2);

  return {
    properties: {
      label: fullAddress,
      score: 0.9,
      housenumber: /^\d+$/.test(housenumber) ? housenumber : undefined,
      street: streetParts.length > 0 ? streetParts.join(" ") : street,
      postcode: postalCode,
      city,
      context: `${department}, ${city}`,
    },
    geometry: {
      coordinates: [2.3522, 48.8566],
    },
  };
};
