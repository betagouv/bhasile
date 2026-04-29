import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/operateurs/route";

const mockGetPaginatedOperateurs = vi.fn();
const mockCountOperateurs = vi.fn();

vi.mock("@/app/api/operateurs/operateur.repository", () => ({
  getPaginatedOperateurs: (...args: unknown[]) =>
    mockGetPaginatedOperateurs(...args),
  countOperateurs: (...args: unknown[]) => mockCountOperateurs(...args),
}));

describe("GET /api/operateurs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return operateurs and total", async () => {
    // GIVEN
    mockGetPaginatedOperateurs.mockResolvedValueOnce([
      {
        id: 1,
        name: "Adoma",
        nb_structures: 2,
        total_places: 20,
        pourcentage_parc: 5.4,
        structure_types: "{CADA,HUDA}",
      },
    ]);
    mockCountOperateurs.mockResolvedValueOnce(10);

    const request = new NextRequest(
      "http://localhost/api/operateurs?page=1&search=Adoma"
    );

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      operateurs: [
        {
          id: 1,
          name: "Adoma",
          nbStructures: 2,
          totalPlaces: 20,
          pourcentageParc: 5.4,
          structureTypes: ["CADA", "HUDA"],
        },
      ],
      totalOperateurs: 10,
    });
    expect(mockGetPaginatedOperateurs).toHaveBeenCalledWith({
      page: "1",
      search: "Adoma",
    });
    expect(mockCountOperateurs).toHaveBeenCalledWith({ search: "Adoma" });
  });
});
