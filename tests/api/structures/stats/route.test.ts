import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/structures/stats/route";

const mockGetLatestPlacesAutoriseesPerStructure = vi.fn();
const mockGetDepartementActivitesAverage = vi.fn();

vi.mock("@/app/api/structures/structure.repository", () => ({
  getLatestPlacesAutoriseesPerStructure: (...args: unknown[]) =>
    mockGetLatestPlacesAutoriseesPerStructure(...args),
}));

vi.mock("@/app/api/activites/activite.repository", () => ({
  getDepartementActivitesAverage: (...args: unknown[]) =>
    mockGetDepartementActivitesAverage(...args),
}));

describe("GET /api/structures/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return min and max places autorisées", async () => {
    // GIVEN
    mockGetLatestPlacesAutoriseesPerStructure.mockResolvedValue([500, 10]);

    // WHEN
    const response = await GET();

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      maxPlacesAutorisees: 500,
      minPlacesAutorisees: 10,
    });
    expect(mockGetLatestPlacesAutoriseesPerStructure).toHaveBeenCalledTimes(2);
  });
});
