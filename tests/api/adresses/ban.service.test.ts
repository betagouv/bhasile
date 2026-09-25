import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CommuneCoordinates } from "@/types/adresse.type";

const SAINT_LO: CommuneCoordinates = {
  latitude: 49.113843,
  longitude: -1.080182,
  nom: "Saint-Lô",
};

// Le mémo vit au niveau du module : on le recharge à chaque test.
const loadModules = async () => {
  vi.resetModules();
  const { localiseStructureVersions, resolveCommuneCoordinates } =
    await import("@/app/api/adresses/ban.service");
  const { searchMunicipality } = await import("@/app/api/adresses/ban.client");
  return {
    localiseStructureVersions,
    resolveCommuneCoordinates,
    searchMunicipality: vi.mocked(searchMunicipality),
  };
};

describe("resolveCommuneCoordinates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("appelle la BAN une seule fois par couple code postal / commune", async () => {
    const { resolveCommuneCoordinates, searchMunicipality } =
      await loadModules();
    searchMunicipality.mockResolvedValue(SAINT_LO);

    const adresses = await resolveCommuneCoordinates([
      { id: 1, codePostal: "50000", commune: "Saint-Lô" },
      { id: 2, codePostal: "50000", commune: "SAINT-LÔ" },
    ]);

    expect(searchMunicipality).toHaveBeenCalledTimes(1);
    expect(adresses).toMatchObject([
      { id: 1, communeCoordinates: SAINT_LO },
      { id: 2, communeCoordinates: SAINT_LO },
    ]);
  });

  it("mémorise les communes trouvées et retente les autres au prochain enregistrement", async () => {
    const { resolveCommuneCoordinates, searchMunicipality } =
      await loadModules();
    searchMunicipality.mockImplementation(async ({ commune }) =>
      commune === "Saint-Lô" ? SAINT_LO : null
    );
    const adresses = [
      { codePostal: "50000", commune: "Saint-Lô" },
      { codePostal: "50000", commune: "Nimporteou" },
    ];

    await resolveCommuneCoordinates(adresses);
    const second = await resolveCommuneCoordinates(adresses);

    expect(searchMunicipality).toHaveBeenCalledTimes(3);
    expect(second.map((adresse) => adresse.communeCoordinates)).toEqual([
      SAINT_LO,
      null,
    ]);
  });

  it("n'appelle pas la BAN pour une adresse sans commune ou sans code postal", async () => {
    const { resolveCommuneCoordinates, searchMunicipality } =
      await loadModules();

    const adresses = await resolveCommuneCoordinates([
      { codePostal: "", commune: "Saint-Lô" },
      { codePostal: "50000", commune: null },
    ]);

    expect(searchMunicipality).not.toHaveBeenCalled();
    expect(adresses.map((adresse) => adresse.communeCoordinates)).toEqual([
      null,
      null,
    ]);
  });
});

describe("localiseStructureVersions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("localise les adresses de chaque version, avec un seul appel par commune", async () => {
    const { localiseStructureVersions, searchMunicipality } =
      await loadModules();
    searchMunicipality.mockResolvedValue(SAINT_LO);

    const [first, withoutVersion, second] = await localiseStructureVersions([
      {
        id: 1,
        structureVersion: {
          adresses: [{ id: 10, codePostal: "50000", commune: "Saint-Lô" }],
        },
      },
      { id: 2 },
      {
        id: 3,
        structureVersion: {
          adresses: [{ id: 30, codePostal: "50000", commune: "Saint-Lô" }],
        },
      },
    ]);

    expect(searchMunicipality).toHaveBeenCalledTimes(1);
    expect(first.structureVersion?.adresses).toMatchObject([
      { id: 10, communeCoordinates: SAINT_LO },
    ]);
    expect(withoutVersion).toEqual({ id: 2, structureVersion: undefined });
    expect(second.structureVersion?.adresses).toMatchObject([
      { id: 30, communeCoordinates: SAINT_LO },
    ]);
  });
});
