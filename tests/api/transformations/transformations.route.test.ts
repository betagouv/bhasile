import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/api/transformations/[id]/route";
import { POST } from "@/app/api/transformations/route";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const mockCreateOne = vi.fn();
const mockFindOne = vi.fn();
const mockUpdateOne = vi.fn();

vi.mock("@/app/api/transformations/transformation.repository", () => ({
  createOne: (...args: unknown[]) => mockCreateOne(...args),
  findOne: (...args: unknown[]) => mockFindOne(...args),
  updateOne: (...args: unknown[]) => mockUpdateOne(...args),
}));

describe("POST /api/transformations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 201 and transformation id when body is valid", async () => {
    mockCreateOne.mockResolvedValueOnce(99);
    const body = {
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureTransformations: [
        {
          structureId: 1,
          type: StructureTransformationType.CREATION,
        },
      ],
    };
    const request = new Request("http://localhost/api/transformations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const response = await POST(request as NextRequest);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: 99 });
    expect(mockCreateOne).toHaveBeenCalledWith(body);
    expect(mockFindOne).not.toHaveBeenCalled();
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it("should return 400 when body does not match schema", async () => {
    const request = new Request("http://localhost/api/transformations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: TransformationType.OUVERTURE_EX_NIHILO,
        structureTransformations: [],
      }),
    });

    const response = await POST(request as NextRequest);

    expect(response.status).toBe(400);
    expect(mockCreateOne).not.toHaveBeenCalled();
  });
});

describe("GET /api/transformations/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 with serialized transformation", async () => {
    const payload = {
      id: 5,
      type: TransformationType.EXTENSION_EX_NIHILO,
      structureTransformations: [],
    };
    mockFindOne.mockResolvedValueOnce(payload);
    const request = new Request("http://localhost/api/transformations/5");

    const response = await GET(request as NextRequest, {
      params: Promise.resolve({ id: "5" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(payload);
    expect(mockFindOne).toHaveBeenCalledWith(5);
  });

  it("should return 404 when transformation is not found", async () => {
    mockFindOne.mockResolvedValueOnce(null);
    const request = new Request("http://localhost/api/transformations/404");

    const response = await GET(request as NextRequest, {
      params: Promise.resolve({ id: "404" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Transformation non trouvée",
    });
    expect(mockFindOne).toHaveBeenCalledWith(404);
  });
});

describe("PUT /api/transformations/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 201 when body is valid", async () => {
    mockUpdateOne.mockResolvedValueOnce(undefined);
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
    expect(await response.json()).toBe(
      "Transformation mise à jour avec succès"
    );
    expect(mockUpdateOne).toHaveBeenCalledWith(body);
  });

  it("should return 400 when body does not match schema", async () => {
    const request = new Request("http://localhost/api/transformations/7", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "not-a-number" }),
    });

    const response = await PUT(request as NextRequest);

    expect(response.status).toBe(400);
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });
});
