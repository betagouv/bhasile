import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/activites/stats/route";

const mockFindAllStructures = vi.fn();
const mockFindActivitesByDnaCodesAndDate = vi.fn();

vi.mock("@/app/api/structures/structure.repository", () => ({
  findAllStructures: () => mockFindAllStructures(),
}));

vi.mock("@/app/api/activites/activite.repository", () => ({
  findActivitesByDnaCodesAndDate: (...args: unknown[]) =>
    mockFindActivitesByDnaCodesAndDate(...args),
}));

let versionIdSeq = 0;

const structureInDepartement = (
  departementAdministratif: string,
  dnaCodes: string[]
) => {
  versionIdSeq += 1;
  return {
    structureVersions: [
      {
        id: versionIdSeq,
        effectiveDate: new Date("2020-01-01T00:00:00.000Z"),
        structureVersionTransformationId: null,
        structureVersionTransformation: null,
        departementAdministratif,
        dnaStructures: dnaCodes.map((code) => ({ dna: { code } })),
      },
    ],
  };
};

describe("GET /api/activites/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calcule la moyenne du département à partir des activités de ses structures courantes", async () => {
    mockFindAllStructures.mockResolvedValueOnce([
      structureInDepartement("75", ["D1"]),
      structureInDepartement("92", ["D2"]),
    ]);
    mockFindActivitesByDnaCodesAndDate.mockResolvedValueOnce([
      { placesAutorisees: 10, placesIndisponibles: 2, tauxOccupation: 0.5 },
      { placesAutorisees: 20, placesIndisponibles: 4, tauxOccupation: 0.5 },
    ]);

    const response = await GET(
      new NextRequest(
        "http://localhost/api/activites/stats?departement=75&startDate=2023-01-01&endDate=2023-12-31"
      )
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.numero).toBe("75");
    expect(body.averagePlacesAutorisees).toBe(15);
    expect(mockFindActivitesByDnaCodesAndDate).toHaveBeenCalledWith(
      ["D1"],
      expect.any(Date),
      expect.any(Date)
    );
  });

  it("renvoie null sans toucher la base quand les dates manquent", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/activites/stats?departement=75")
    );

    expect(await response.json()).toBeNull();
    expect(mockFindAllStructures).not.toHaveBeenCalled();
  });
});
