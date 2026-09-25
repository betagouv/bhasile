import { afterEach, describe, expect, it, vi } from "vitest";

vi.unmock("@/app/api/adresses/ban.client");

import { searchMunicipality } from "@/app/api/adresses/ban.client";

const mockFetch = vi.fn();

const EU_BODY = {
  features: [
    {
      geometry: { coordinates: [1.423036, 50.04029] },
      properties: { city: "Eu" },
    },
  ],
};

describe("searchMunicipality", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it("interroge la BAN en communes filtrées par code postal, code postal répété dans la recherche", async () => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(EU_BODY), { status: 200 })
    );

    await searchMunicipality({ codePostal: "76260", commune: "Eu" });

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe(
      "https://data.geopf.fr/geocodage/search/"
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({
      q: "Eu 76260",
      type: "municipality",
      postcode: "76260",
      limit: "1",
    });
    expect(mockFetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("renvoie le centre et le nom officiel de la commune trouvée", async () => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(EU_BODY), { status: 200 })
    );

    expect(
      await searchMunicipality({ codePostal: "76260", commune: "Eu" })
    ).toEqual({ latitude: 50.04029, longitude: 1.423036, nom: "Eu" });
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
