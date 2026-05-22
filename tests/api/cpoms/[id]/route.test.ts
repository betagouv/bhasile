import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/api/cpoms/[id]/route";

const mockFindOne = vi.fn();
const mockCreateOrUpdateCpom = vi.fn();
const mockCreateCpomEvent = vi.fn();

vi.mock("@/app/api/cpoms/cpom.repository", () => ({
  findOne: (...args: unknown[]) => mockFindOne(...args),
  createOrUpdateCpom: (...args: unknown[]) => mockCreateOrUpdateCpom(...args),
}));

vi.mock("@/app/api/user-action/user-action.service", () => ({
  createCpomEvent: (...args: unknown[]) => mockCreateCpomEvent(...args),
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
    expect(await response.json()).toEqual({
      id: 1,
      dateStart: null,
      dateEnd: null,
    });
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
    expect(await response.json()).toEqual({ error: "CPOM non trouvé" });
    expect(mockFindOne).toHaveBeenCalledWith(99);
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
    expect(mockFindOne).toHaveBeenCalledWith(1);
  });
});

describe("PUT /api/cpoms/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 with cpomId on success", async () => {
    // GIVEN
    mockCreateOrUpdateCpom.mockResolvedValueOnce(2);

    const request = new Request("http://localhost/api/cpoms/1", {
      method: "PUT",
      body: JSON.stringify({ operateur: { name: "Opérateur Test" } }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ cpomId: 2 });
    expect(mockCreateCpomEvent).toHaveBeenCalledWith("PUT", 2);
    expect(mockCreateOrUpdateCpom).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 })
    );
  });

  it("should return 400 when body is invalid", async () => {
    // GIVEN
    const request = new Request("http://localhost/api/cpoms/1", {
      method: "PUT",
      body: JSON.stringify({ operateur: { name: "" } }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(400);
    expect(mockCreateOrUpdateCpom).not.toHaveBeenCalled();
    expect(mockCreateCpomEvent).not.toHaveBeenCalled();
  });
});
