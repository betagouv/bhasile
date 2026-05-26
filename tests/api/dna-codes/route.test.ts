import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/dna-codes/route";

const mockFindAll = vi.fn();

vi.mock("@/app/api/dna-codes/dna-codes.repository", () => ({
  findAll: (...args: unknown[]) => mockFindAll(...args),
}));

describe("GET /api/dna-codes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return unassigned dna codes when structureId is missing", async () => {
    // GIVEN
    const dnaCodes = [{ code: "C0001" }];
    mockFindAll.mockResolvedValueOnce(dnaCodes);

    const request = new NextRequest("http://localhost/api/dna-codes");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(dnaCodes);
    expect(mockFindAll).toHaveBeenCalledWith({ structureId: undefined });
  });

  it("should fall back to unassigned codes when structureId is not a number", async () => {
    // GIVEN
    const dnaCodes = [{ code: "C0001" }];
    mockFindAll.mockResolvedValueOnce(dnaCodes);

    const request = new NextRequest(
      "http://localhost/api/dna-codes?structureId=abc"
    );

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(dnaCodes);
    expect(mockFindAll).toHaveBeenCalledWith({ structureId: undefined });
  });

  it("should return dna codes for a valid structureId", async () => {
    // GIVEN
    const dnaCodes = [{ id: 1, code: "C0001" }];
    mockFindAll.mockResolvedValueOnce(dnaCodes);

    const request = new NextRequest(
      "http://localhost/api/dna-codes?structureId=42"
    );

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(dnaCodes);
    expect(mockFindAll).toHaveBeenCalledWith({ structureId: 42 });
  });

  it("should return 500 when repository throws", async () => {
    // GIVEN
    mockFindAll.mockRejectedValueOnce(new Error("DB error"));

    const request = new NextRequest(
      "http://localhost/api/dna-codes?structureId=42"
    );

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(500);
  });
});
