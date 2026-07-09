import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/operateurs/route";

const mockFindAllStructures = vi.fn();
const mockFindAllOperateurs = vi.fn();

vi.mock("@/app/api/structures/structure.repository", () => ({
  findAllStructures: () => mockFindAllStructures(),
}));

vi.mock("@/app/api/operateurs/operateur.repository", () => ({
  findAllOperateurs: () => mockFindAllOperateurs(),
}));

let versionIdSeq = 0;

const structureFixture = (
  id: number,
  operateurId: number | null,
  placesAutorisees: number,
  type: string
) => {
  versionIdSeq += 1;
  return {
    id,
    operateurId,
    type,
    structureVersions: [
      {
        id: versionIdSeq,
        effectiveDate: new Date("2020-01-01T00:00:00.000Z"),
        structureVersionTransformationId: null,
        structureVersionTransformation: null,
        structureTypologies: [{ year: 2024, placesAutorisees }],
      },
    ],
  };
};

describe("GET /api/operateurs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("remonte les structures de filiale dans la mère, garde le dénominateur global, et exclut les opérateurs sans structure", async () => {
    mockFindAllStructures.mockResolvedValueOnce([
      structureFixture(1, 1, 20, "CADA"),
      structureFixture(2, 1, 10, "HUDA"),
      structureFixture(3, 2, 30, "CADA"),
      structureFixture(4, 99, 40, "CADA"),
    ]);
    mockFindAllOperateurs.mockResolvedValueOnce([
      { id: 1, name: "Alpha", parentId: null, logo: { key: "logo-a" } },
      { id: 2, name: "Beta", parentId: null, logo: null },
      { id: 5, name: "Gamma", parentId: null, logo: null },
      { id: 99, name: "Alpha Filiale", parentId: 1, logo: null },
    ]);

    const response = await GET(new NextRequest("http://localhost/api/operateurs"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.totalOperateurs).toBe(2);
    expect(body.operateurs).toEqual([
      {
        id: 1,
        name: "Alpha",
        nbStructures: 3,
        totalPlaces: 70,
        pourcentageParc: 70,
        structureTypes: ["CADA", "HUDA"],
        logo: { key: "logo-a" },
      },
      {
        id: 2,
        name: "Beta",
        nbStructures: 1,
        totalPlaces: 30,
        pourcentageParc: 30,
        structureTypes: ["CADA"],
        logo: { key: null },
      },
    ]);
  });

  it("filtre par recherche (insensible à la casse et aux accents)", async () => {
    mockFindAllStructures.mockResolvedValueOnce([
      structureFixture(1, 1, 20, "CADA"),
      structureFixture(2, 2, 30, "CADA"),
    ]);
    mockFindAllOperateurs.mockResolvedValueOnce([
      { id: 1, name: "Forum réfugiés", parentId: null, logo: null },
      { id: 2, name: "Adoma", parentId: null, logo: null },
    ]);

    const response = await GET(
      new NextRequest("http://localhost/api/operateurs?search=refugies")
    );

    const body = await response.json();
    expect(body.totalOperateurs).toBe(1);
    expect(body.operateurs.map((operateur: { name: string }) => operateur.name)).toEqual([
      "Forum réfugiés",
    ]);
  });
});
