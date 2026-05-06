import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/activites/stats/route";

const mockGetDepartementActivitesAverage = vi.fn();

vi.mock("@/app/api/activites/activite.repository", () => ({
  getDepartementActivitesAverage: (...args: unknown[]) =>
    mockGetDepartementActivitesAverage(...args),
}));

describe("GET /api/activites/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return average departement places with query params", async () => {
    // GIVEN
    mockGetDepartementActivitesAverage.mockResolvedValueOnce({ average: 42 });

    const request = new NextRequest(
      "http://localhost/api/activites/stats?departement=75&startDate=2023-01-01&endDate=2023-12-31"
    );

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ average: 42 });
    expect(mockGetDepartementActivitesAverage).toHaveBeenCalledWith(
      "75",
      "2023-01-01",
      "2023-12-31"
    );
  });

  it("should return average departement places without query params", async () => {
    // GIVEN
    mockGetDepartementActivitesAverage.mockResolvedValueOnce({ average: 0 });

    const request = new NextRequest("http://localhost/api/activites/stats");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ average: 0 });
    expect(mockGetDepartementActivitesAverage).toHaveBeenCalledWith(
      null,
      null,
      null
    );
  });
});
