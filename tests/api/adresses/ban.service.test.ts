import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { searchMunicipality } from "@/app/api/adresses/ban.client";
import {
  locateStructureVersions,
  resolveCommuneCoordinates,
} from "@/app/api/adresses/ban.service";
import type { CommuneCoordinates } from "@/types/adresse.type";

vi.mock("@/app/api/adresses/ban.client", () => ({
  searchMunicipality: vi.fn(),
  searchAddress: vi.fn(),
}));

const SAINT_LO: CommuneCoordinates = {
  latitude: 49.113843,
  longitude: -1.080182,
  nom: "Saint-Lô",
};

const mockSearchMunicipality = vi.mocked(searchMunicipality);

describe("resolveCommuneCoordinates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("appelle la BAN une seule fois par couple code postal / commune", async () => {
    mockSearchMunicipality.mockResolvedValue(SAINT_LO);

    const adresses = await resolveCommuneCoordinates([
      { id: 1, codePostal: "50000", commune: "Saint-Lô" },
      { id: 2, codePostal: "50000", commune: "SAINT-LÔ" },
    ]);

    expect(mockSearchMunicipality).toHaveBeenCalledTimes(1);
    expect(adresses).toMatchObject([
      { id: 1, communeCoordinates: SAINT_LO },
      { id: 2, communeCoordinates: SAINT_LO },
    ]);
  });

  it("n'appelle pas la BAN pour une adresse sans commune ou sans code postal", async () => {
    const adresses = await resolveCommuneCoordinates([
      { codePostal: "", commune: "Saint-Lô" },
      { codePostal: "50000", commune: null },
    ]);

    expect(mockSearchMunicipality).not.toHaveBeenCalled();
    expect(adresses.map((adresse) => adresse.communeCoordinates)).toEqual([
      null,
      null,
    ]);
  });

  it("interroge la BAN par lots de 25 communes espacés d'une seconde", async () => {
    vi.useFakeTimers();
    mockSearchMunicipality.mockResolvedValue(SAINT_LO);
    const adresses = Array.from({ length: 30 }, (_, index) => ({
      codePostal: "50000",
      commune: `Commune ${index}`,
    }));

    const resolution = resolveCommuneCoordinates(adresses);
    await vi.advanceTimersByTimeAsync(0);
    expect(mockSearchMunicipality).toHaveBeenCalledTimes(25);

    await vi.advanceTimersByTimeAsync(1_000);
    await resolution;
    expect(mockSearchMunicipality).toHaveBeenCalledTimes(30);
  });
});

describe("locateStructureVersions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("localise les adresses de chaque version, avec un seul appel par commune", async () => {
    mockSearchMunicipality.mockResolvedValue(SAINT_LO);

    const [first, withoutVersion, second] = await locateStructureVersions([
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

    expect(mockSearchMunicipality).toHaveBeenCalledTimes(1);
    expect(first.structureVersion?.adresses).toMatchObject([
      { id: 10, communeCoordinates: SAINT_LO },
    ]);
    expect(withoutVersion).toEqual({ id: 2, structureVersion: undefined });
    expect(second.structureVersion?.adresses).toMatchObject([
      { id: 30, communeCoordinates: SAINT_LO },
    ]);
  });
});
