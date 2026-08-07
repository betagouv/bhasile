import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveArrondissementCode } from "@/app/api/communes/commune.service";

const mockFindCommunesByNormalizedName = vi.fn();
const mockFindCommunesByCodePostal = vi.fn();

vi.mock("@/app/api/communes/commune.repository", () => ({
  findCommunesByNormalizedName: (...args: unknown[]) =>
    mockFindCommunesByNormalizedName(...args),
  findCommunesByCodePostal: (...args: unknown[]) =>
    mockFindCommunesByCodePostal(...args),
}));

describe("resolveArrondissementCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindCommunesByNormalizedName.mockResolvedValue([]);
    mockFindCommunesByCodePostal.mockResolvedValue([]);
  });

  it("résout sur le couple code postal et nom de commune", async () => {
    mockFindCommunesByNormalizedName.mockResolvedValue([
      { codesPostaux: ["01300"], arrondissementCode: "011" },
    ]);

    expect(await resolveArrondissementCode("01300", "Belley")).toBe("011");
    expect(mockFindCommunesByNormalizedName).toHaveBeenCalledWith(
      "BELLEY",
      undefined
    );
  });

  it("normalise le nom de commune avant la recherche", async () => {
    mockFindCommunesByNormalizedName.mockResolvedValue([
      { codesPostaux: ["01400"], arrondissementCode: "012" },
    ]);

    expect(
      await resolveArrondissementCode("01400", "l'abergement-clémenciat")
    ).toBe("012");
    expect(mockFindCommunesByNormalizedName).toHaveBeenCalledWith(
      "L ABERGEMENT CLEMENCIAT",
      undefined
    );
  });

  it("écarte une commune homonyme dont le code postal ne correspond pas", async () => {
    mockFindCommunesByNormalizedName.mockResolvedValue([
      { codesPostaux: ["21350"], arrondissementCode: "211" },
      { codesPostaux: ["33350"], arrondissementCode: "332" },
    ]);
    mockFindCommunesByCodePostal.mockResolvedValue([
      { codesPostaux: ["33350"], arrondissementCode: "332" },
    ]);

    expect(await resolveArrondissementCode("33350", "Sainte-Colombe")).toBe(
      "332"
    );
  });

  it("retombe sur le code postal seul quand le nom de commune ne correspond à rien", async () => {
    mockFindCommunesByCodePostal.mockResolvedValue([
      { codesPostaux: ["01300"], arrondissementCode: "011" },
    ]);

    expect(
      await resolveArrondissementCode("01300", "Commune Inexistante")
    ).toBe("011");
  });

  it("résout sur le code postal seul quand la commune est absente", async () => {
    mockFindCommunesByCodePostal.mockResolvedValue([
      { codesPostaux: ["75002"], arrondissementCode: "751" },
    ]);

    expect(await resolveArrondissementCode("75002", null)).toBe("751");
    expect(mockFindCommunesByNormalizedName).not.toHaveBeenCalled();
  });

  it("accepte un code postal couvrant plusieurs communes d'un même arrondissement", async () => {
    mockFindCommunesByCodePostal.mockResolvedValue([
      { codesPostaux: ["01300"], arrondissementCode: "011" },
      { codesPostaux: ["01300"], arrondissementCode: "011" },
    ]);

    expect(await resolveArrondissementCode("01300", null)).toBe("011");
  });

  it("renvoie null quand le code postal chevauche deux arrondissements", async () => {
    mockFindCommunesByCodePostal.mockResolvedValue([
      { codesPostaux: ["01300"], arrondissementCode: "011" },
      { codesPostaux: ["01300"], arrondissementCode: "012" },
    ]);

    expect(await resolveArrondissementCode("01300", null)).toBeNull();
  });

  it("renvoie null pour une commune sans arrondissement, comme à Mayotte", async () => {
    mockFindCommunesByNormalizedName.mockResolvedValue([
      { codesPostaux: ["97600"], arrondissementCode: null },
    ]);
    mockFindCommunesByCodePostal.mockResolvedValue([
      { codesPostaux: ["97600"], arrondissementCode: null },
    ]);

    expect(await resolveArrondissementCode("97600", "Mamoudzou")).toBeNull();
  });

  it("renvoie null sans requête quand le code postal est vide", async () => {
    expect(await resolveArrondissementCode("   ", "Belley")).toBeNull();
    expect(await resolveArrondissementCode(null, "Belley")).toBeNull();
    expect(mockFindCommunesByNormalizedName).not.toHaveBeenCalled();
    expect(mockFindCommunesByCodePostal).not.toHaveBeenCalled();
  });

  it("renvoie null quand le code postal est inconnu du référentiel", async () => {
    expect(await resolveArrondissementCode("99999", "Nulleville")).toBeNull();
  });
});
