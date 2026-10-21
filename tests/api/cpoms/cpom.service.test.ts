import { beforeEach, describe, expect, it, vi } from "vitest";

import { prepareCpomToSave } from "@/app/api/cpoms/cpom.service";

const mockFindRegionIdByName = vi.fn();

vi.mock("@/app/api/cpoms/cpom.repository", () => ({
  findRegionIdByName: (...args: unknown[]) => mockFindRegionIdByName(...args),
}));

const departements = [{ departement: { numero: "59" } }];
const existingCpom = {
  granularity: "DEPARTEMENTALE" as const,
  regionId: 7,
  departements,
  structures: [],
};

describe("prepareCpomToSave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindRegionIdByName.mockResolvedValue(7);
  });

  it("vide les départements d'un CPOM régional et résout sa région", async () => {
    const cpomToSave = await prepareCpomToSave(
      {
        granularity: "REGIONALE",
        region: { name: "Hauts-de-France" },
        departements,
      },
      null
    );

    expect(mockFindRegionIdByName).toHaveBeenCalledWith("Hauts-de-France");
    expect(cpomToSave).toMatchObject({
      granularity: "REGIONALE",
      regionId: 7,
      departements: [],
    });
  });

  it("garde les départements d'un CPOM départemental", async () => {
    const cpomToSave = await prepareCpomToSave(
      { granularity: "DEPARTEMENTALE", departements },
      null
    );

    expect(cpomToSave.departements).toEqual(departements);
    expect(cpomToSave.regionId).toBeUndefined();
  });

  it("reprend la granularité existante quand le payload ne la précise pas", async () => {
    const cpomToSave = await prepareCpomToSave({ departements }, existingCpom);

    expect(cpomToSave).toMatchObject({
      granularity: "DEPARTEMENTALE",
      departements,
    });
  });

  it("vide les départements d'un CPOM resté régional même sans granularité dans le payload", async () => {
    const cpomToSave = await prepareCpomToSave(
      { departements },
      { ...existingCpom, granularity: "REGIONALE" }
    );

    expect(cpomToSave.departements).toEqual([]);
  });
});
