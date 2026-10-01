import { afterEach, describe, expect, it, vi } from "vitest";

vi.unmock("@/app/api/adresses/ban.client");

import { searchMunicipality } from "@/app/api/adresses/ban.client";

const mockFetch = vi.fn();

const buildFeature = (
  city: string,
  citycode: string,
  coordinates: [number, number]
) => ({ geometry: { coordinates }, properties: { city, citycode } });

const respondWith = (features: ReturnType<typeof buildFeature>[]) => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockImplementation(
    async () => new Response(JSON.stringify({ features }), { status: 200 })
  );
};

const getSearchParams = () =>
  Object.fromEntries(new URL(mockFetch.mock.calls[0][0]).searchParams);

describe("searchMunicipality", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it("cherche la commune seule parmi les communes de la BAN, sans filtrer sur le code postal", async () => {
    respondWith([]);

    await searchMunicipality({
      codePostal: "94290",
      commune: "Villeneuve-Saint-Georges",
    });

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe(
      "https://data.geopf.fr/geocodage/search/"
    );
    expect(getSearchParams()).toEqual({
      q: "Villeneuve-Saint-Georges",
      type: "municipality",
      limit: "20",
    });
    expect(mockFetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("ajoute le code postal à la recherche d'un nom trop court pour la BAN", async () => {
    respondWith([]);

    await searchMunicipality({ codePostal: "76260", commune: "Eu" });

    expect(getSearchParams().q).toBe("Eu 76260");
  });

  it("retient la commune du département du code postal parmi les homonymes", async () => {
    respondWith([
      buildFeature("Sainte-Colombe", "33403", [-0.05, 44.88]),
      buildFeature("Sainte-Colombe", "77410", [3.26, 48.53]),
    ]);

    expect(
      await searchMunicipality({
        codePostal: "77650",
        commune: "Sainte-Colombe",
      })
    ).toEqual({ latitude: 48.53, longitude: 3.26, nom: "Sainte-Colombe" });
    expect(
      await searchMunicipality({
        codePostal: "71000",
        commune: "Sainte-Colombe",
      })
    ).toBeNull();
  });

  it("rapproche les codes commune corses (2A, 2B) de leur code postal en 20", async () => {
    respondWith([buildFeature("Ajaccio", "2A004", [8.7, 41.93])]);

    expect(
      await searchMunicipality({ codePostal: "20000", commune: "Ajaccio" })
    ).toEqual({ latitude: 41.93, longitude: 8.7, nom: "Ajaccio" });
  });

  it("rend null quand la commune est introuvable, refusée ou que la BAN ne répond pas", async () => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ features: [] }), { status: 200 })
      )
      .mockResolvedValueOnce(new Response("{}", { status: 400 }))
      .mockRejectedValueOnce(new DOMException("timeout", "TimeoutError"));
    const localisation = { codePostal: "50000", commune: "Nimporteou" };

    expect(await searchMunicipality(localisation)).toBeNull();
    expect(await searchMunicipality(localisation)).toBeNull();
    expect(await searchMunicipality(localisation)).toBeNull();
  });
});
