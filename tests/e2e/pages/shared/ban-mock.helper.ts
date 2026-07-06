import type { Page } from "@playwright/test";

/**
 * Mock l'API de géocodage BAN (`data.geopf.fr/geocodage`) utilisée par
 * l'autocomplete d'adresse, pour rendre les tests déterministes et hors-ligne.
 * Renvoie toujours une suggestion unique exploitable.
 */
export const mockBanApi = async (page: Page): Promise<void> => {
  await page.route("https://data.geopf.fr/geocodage/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        type: "FeatureCollection",
        features: [
          {
            properties: {
              label: "55 Rue Saint-Dominique 75007 Paris",
              score: 0.99,
              housenumber: "55",
              street: "Rue Saint-Dominique",
              name: "55 Rue Saint-Dominique",
              postcode: "75007",
              city: "Paris",
              citycode: "75107",
              context: "75, Paris, Île-de-France",
              type: "housenumber",
              importance: 0.9,
              id: "75107_8909_00055",
            },
            geometry: { type: "Point", coordinates: [2.3127, 48.8589] },
          },
        ],
      }),
    });
  });
};
