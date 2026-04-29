import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/cpoms/[id]/route";

const mockFindOne = vi.fn();

vi.mock("@/app/api/cpoms/cpom.repository", () => ({
  findOne: (...args: unknown[]) => mockFindOne(...args),
}));

describe("GET /api/cpoms/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return cpom when found", async () => {
    // GIVEN
    const cpom = { id: 1 };
    mockFindOne.mockResolvedValueOnce(cpom);

    const request = new NextRequest("http://localhost/api/cpoms/1");

    // WHEN
    const response = await GET(request, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(cpom);
    expect(mockFindOne).toHaveBeenCalledWith(1);
  });

  it("should return 404 when cpom is not found", async () => {
    // GIVEN
    mockFindOne.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost/api/cpoms/99");

    // WHEN
    const response = await GET(request, {
      params: Promise.resolve({ id: "99" }),
    });

    // THEN
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Structure not found" });
  });

  it("should return 500 when repository throws", async () => {
    // GIVEN
    mockFindOne.mockRejectedValueOnce(new Error("DB error"));

    const request = new NextRequest("http://localhost/api/cpoms/1");

    // WHEN
    const response = await GET(request, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(500);
  });
});
