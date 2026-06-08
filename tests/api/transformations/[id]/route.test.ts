import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/api/transformations/[id]/route";
import { TransformationType } from "@/types/transformation.type";

const mockGetTransformation = vi.fn();
const mockUpdateTransformation = vi.fn();
const mockDeleteTransformation = vi.fn();

vi.mock("@/app/api/transformations/transformation.service", () => ({
  getTransformation: (...args: unknown[]) => mockGetTransformation(...args),
  updateTransformation: (...args: unknown[]) =>
    mockUpdateTransformation(...args),
  deleteTransformation: (...args: unknown[]) =>
    mockDeleteTransformation(...args),
}));

describe("GET /api/transformations/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 with serialized transformation", async () => {
    const payload = {
      id: 5,
      type: TransformationType.EXTENSION_EX_NIHILO,
      structureVersionTransformations: [],
    };
    mockGetTransformation.mockResolvedValueOnce(payload);
    const request = new Request("http://localhost/api/transformations/5");

    const response = await GET(request as NextRequest, {
      params: Promise.resolve({ id: "5" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(payload);
    expect(mockGetTransformation).toHaveBeenCalledWith(5);
  });

  it("should return 404 when transformation is not found", async () => {
    mockGetTransformation.mockResolvedValueOnce(null);
    const request = new Request("http://localhost/api/transformations/404");

    const response = await GET(request as NextRequest, {
      params: Promise.resolve({ id: "404" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Transformation non trouvée",
    });
    expect(mockGetTransformation).toHaveBeenCalledWith(404);
  });
});

describe("PUT /api/transformations/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 201 when body is valid", async () => {
    mockUpdateTransformation.mockResolvedValueOnce(7);
    const body = {
      id: 7,
      type: TransformationType.FERMETURE_SANS_TRANSFERT,
    };
    const request = new Request("http://localhost/api/transformations/7", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const response = await PUT(request as NextRequest);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ transformationId: 7 });
    expect(mockUpdateTransformation).toHaveBeenCalledWith(body);
  });

  it("should return 400 when body does not match schema", async () => {
    const request = new Request("http://localhost/api/transformations/7", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "not-a-number" }),
    });

    const response = await PUT(request as NextRequest);

    expect(response.status).toBe(400);
    expect(mockUpdateTransformation).not.toHaveBeenCalled();
  });
});
