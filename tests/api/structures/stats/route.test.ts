import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/structures/stats/route";

const mockfindAllStructures = vi.fn();

vi.mock("@/app/api/structures/structure.repository", () => ({
  findAllStructures: (...args: unknown[]) => mockfindAllStructures(...args),
}));

const lightStructureWithPlaces = (id: number, placesAutorisees: number) =>
  ({
    id,
    codeBhasile: `S-${id}`,
    operateur: { name: "Op" },
    forms: [],
    actesAdministratifs: [],
    structureVersions: [
      {
        id: id * 10,
        effectiveDate: new Date("2020-01-01T00:00:00.000Z"),
        structureVersionTransformationId: null,
        type: "CADA",
        nom: "x",
        departementAdministratif: "75",
        communeAdministrative: "Paris",
        codePostalAdministratif: "75001",
        latitude: null,
        longitude: null,
        structureVersionTransformation: null,
        adresses: [],
        placesAutorisees,
        dnaStructures: [],
        structureFinesses: [],
      },
    ],
  }) as unknown;

describe("GET /api/structures/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne le minimum et le maximum de places autorisées", async () => {
    // GIVEN
    mockfindAllStructures.mockResolvedValue([
      lightStructureWithPlaces(1, 500),
      lightStructureWithPlaces(2, 10),
    ]);

    // WHEN
    const response = await GET();

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      maxPlacesAutorisees: 500,
      minPlacesAutorisees: 10,
    });
    expect(mockfindAllStructures).toHaveBeenCalledTimes(1);
  });
});
