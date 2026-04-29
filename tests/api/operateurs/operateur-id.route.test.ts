import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/api/operateurs/[id]/route";

const mockFindOne = vi.fn();
const mockUpdateOne = vi.fn();
const mockCreateOperateurEvent = vi.fn();

vi.mock("@/app/api/operateurs/operateur.repository", () => ({
  findOne: (...args: unknown[]) => mockFindOne(...args),
  updateOne: (...args: unknown[]) => mockUpdateOne(...args),
}));

vi.mock("@/app/api/user-action/user-action.service", () => ({
  createOperateurEvent: (...args: unknown[]) =>
    mockCreateOperateurEvent(...args),
}));

describe("GET /api/operateurs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return operateur when found", async () => {
    // GIVEN
    const operateur = { id: 1, name: "Adoma", structures: [] };
    mockFindOne.mockResolvedValueOnce(operateur);

    const request = new NextRequest("http://localhost/api/operateurs/1");

    // WHEN
    const response = await GET(request, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ...operateur, vulnerabilites: [] });
    expect(mockFindOne).toHaveBeenCalledWith(1);
    expect(mockCreateOperateurEvent).toHaveBeenCalledWith("GET", 1);
  });

  it("should return 500 when operateur is not found", async () => {
    // GIVEN
    mockFindOne.mockRejectedValueOnce(new Error("Not found"));

    const request = new NextRequest("http://localhost/api/operateurs/99");

    // WHEN
    const response = await GET(request, {
      params: Promise.resolve({ id: "99" }),
    });

    // THEN
    expect(response.status).toBe(500);
    expect(mockCreateOperateurEvent).not.toHaveBeenCalled();
  });

  it("should return 500 when service throws", async () => {
    // GIVEN
    mockFindOne.mockRejectedValueOnce(new Error("DB error"));

    const request = new NextRequest("http://localhost/api/operateurs/1");

    // WHEN
    const response = await GET(request, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(500);
    expect(mockFindOne).toHaveBeenCalledWith(1);
  });
});

describe("PUT /api/operateurs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 201 with operateurId on success", async () => {
    // GIVEN
    const payload = { id: 1, name: "Adoma Modifié" };
    mockUpdateOne.mockResolvedValueOnce({ id: 1 });

    const request = new Request("http://localhost/api/operateurs/1", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ operateurId: 1 });
    expect(mockCreateOperateurEvent).toHaveBeenCalledWith("PUT", 1);
  });

  it("should return 400 when payload is invalid", async () => {
    // GIVEN
    const request = new Request("http://localhost/api/operateurs/1", {
      method: "PUT",
      body: JSON.stringify({ id: "not-a-number" }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(400);
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });
});
