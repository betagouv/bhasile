import { beforeEach, describe, expect, it, vi } from "vitest";

import { prepareCpomToSave } from "@/app/api/cpoms/cpom.service";

const mockFindRegionIdByName = vi.fn();
const mockFindStructuresOperateur = vi.fn();

vi.mock("@/app/api/cpoms/cpom.repository", () => ({}));

vi.mock("@/app/api/operateurs/operateur.repository", () => ({}));

vi.mock("@/app/api/structures/structure.repository", () => ({
  findStructuresOperateur: (...args: unknown[]) =>
    mockFindStructuresOperateur(...args),
}));

vi.mock("@/app/api/regions/region.repository", () => ({
  findRegionIdByName: (...args: unknown[]) => mockFindRegionIdByName(...args),
}));

const departements = [{ departement: { numero: "59" } }];
const operateur = { id: 3, name: "Adoma" };
const existingCpom = {
  operateurId: 3,
  granularity: "DEPARTEMENTALE" as const,
  regionId: 7,
  departements,
  structures: [],
};

describe("prepareCpomToSave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindRegionIdByName.mockResolvedValue(7);
    mockFindStructuresOperateur.mockResolvedValue([]);
  });

  it("vide les départements d'un CPOM régional et résout sa région", async () => {
    const cpomToSave = await prepareCpomToSave(
      {
        operateur,
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
      { operateur, granularity: "DEPARTEMENTALE", departements },
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

  it("rejette un CPOM régional dont la région est introuvable", async () => {
    mockFindRegionIdByName.mockResolvedValueOnce(undefined);

    await expect(
      prepareCpomToSave(
        {
          operateur,
          granularity: "REGIONALE",
          region: { name: "Inconnue" },
          departements,
        },
        null
      )
    ).rejects.toThrow("Région introuvable");
  });

  it("rejette un nouveau CPOM sans opérateur", async () => {
    await expect(
      prepareCpomToSave({ granularity: "DEPARTEMENTALE", departements }, null)
    ).rejects.toThrow("Un CPOM doit avoir un opérateur");
  });

  it("reprend l'opérateur du CPOM existant quand le payload ne le précise pas", async () => {
    const cpomToSave = await prepareCpomToSave({ departements }, existingCpom);

    expect(cpomToSave.operateurId).toBe(3);
  });

  it("rejette un nouveau CPOM sans granularité", async () => {
    await expect(
      prepareCpomToSave({ operateur, departements }, null)
    ).rejects.toThrow("Un CPOM doit avoir une granularité");
  });

  it("rejette un nouveau CPOM régional sans région", async () => {
    await expect(
      prepareCpomToSave(
        {
          operateur,
          granularity: "REGIONALE",
          region: { name: "" },
          departements,
        },
        null
      )
    ).rejects.toThrow("Un CPOM régional doit avoir une région");
  });

  it("garde les départements d'un ancien CPOM régional sans région lors d'une modification partielle", async () => {
    const cpomToSave = await prepareCpomToSave(
      { name: "CPOM" },
      { ...existingCpom, granularity: "REGIONALE", regionId: null }
    );

    expect(mockFindRegionIdByName).not.toHaveBeenCalled();
    expect(cpomToSave.departements).toBeUndefined();
  });

  it("vide les départements d'un CPOM resté régional même sans granularité dans le payload", async () => {
    const cpomToSave = await prepareCpomToSave(
      { departements },
      { ...existingCpom, granularity: "REGIONALE" }
    );

    expect(cpomToSave.departements).toEqual([]);
  });

  it("rejette une composition qui contient une structure d'un autre opérateur", async () => {
    mockFindStructuresOperateur.mockResolvedValue([
      { codeBhasile: "BHA-1", operateurId: 3 },
      { codeBhasile: "BHA-2", operateurId: 4 },
    ]);

    await expect(
      prepareCpomToSave(
        {
          structures: [{ structureId: 1 }, { structureId: 2 }],
        },
        existingCpom
      )
    ).rejects.toThrow(
      "Structures d'un autre opérateur que celui du CPOM : BHA-2"
    );
    expect(mockFindStructuresOperateur).toHaveBeenCalledWith([1, 2]);
  });

  it("vérifie les structures déjà rattachées quand l'opérateur du CPOM change", async () => {
    mockFindStructuresOperateur.mockResolvedValue([
      { codeBhasile: "BHA-1", operateurId: 3 },
    ]);

    await expect(
      prepareCpomToSave(
        { operateur: { id: 5, name: "Coallia" } },
        { ...existingCpom, structures: [{ structureId: 1 }] }
      )
    ).rejects.toThrow(
      "Structures d'un autre opérateur que celui du CPOM : BHA-1"
    );
  });

  it("ne vérifie rien sans changement de composition ni d'opérateur", async () => {
    await prepareCpomToSave(
      { name: "CPOM" },
      { ...existingCpom, structures: [{ structureId: 1 }] }
    );

    expect(mockFindStructuresOperateur).not.toHaveBeenCalled();
  });
});
