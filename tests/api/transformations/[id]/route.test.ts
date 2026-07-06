import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/api/transformations/[id]/route";
import { ApiDomainError } from "@/app/utils/apiErrorResponse.util";
import { TransformationType } from "@/types/transformation.type";

const mockGetTransformation = vi.fn();
const mockUpdateTransformation = vi.fn();
const mockDeleteTransformation = vi.fn();
const mockGetServerSession = vi.fn();
const mockCanUpdateTransformation = vi.fn();

vi.mock("@/app/api/transformations/transformation.service", () => ({
  getTransformation: (...args: unknown[]) => mockGetTransformation(...args),
  updateTransformation: (...args: unknown[]) =>
    mockUpdateTransformation(...args),
  deleteTransformation: (...args: unknown[]) =>
    mockDeleteTransformation(...args),
}));

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/casl/abilities", () => ({
  canUpdateTransformation: (...args: unknown[]) =>
    mockCanUpdateTransformation(...args),
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
  const validBody = {
    id: 7,
    type: TransformationType.FERMETURE_SANS_TRANSFERT,
  };

  const buildRequest = (body: unknown) =>
    new Request("http://localhost/api/transformations/7", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { id: "agent-1" } });
    mockCanUpdateTransformation.mockReturnValue(true);
    mockGetTransformation.mockResolvedValue({
      id: 7,
      type: TransformationType.FERMETURE_SANS_TRANSFERT,
      structureVersionTransformations: [],
    });
  });

  it("should return 201 when body is valid and user is authorized", async () => {
    mockUpdateTransformation.mockResolvedValueOnce(7);

    const response = await PUT(buildRequest(validBody));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ transformationId: 7 });
    expect(mockUpdateTransformation).toHaveBeenCalledWith(validBody);
  });

  it("should return 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const response = await PUT(buildRequest(validBody));

    expect(response.status).toBe(401);
    expect(mockUpdateTransformation).not.toHaveBeenCalled();
  });

  it("should return 403 when the user cannot update the transformation department", async () => {
    mockCanUpdateTransformation.mockReturnValueOnce(false);

    const response = await PUT(buildRequest(validBody));

    expect(response.status).toBe(403);
    expect(mockUpdateTransformation).not.toHaveBeenCalled();
  });

  it("should return 404 when the transformation does not exist", async () => {
    mockGetTransformation.mockResolvedValueOnce(null);

    const response = await PUT(buildRequest(validBody));

    expect(response.status).toBe(404);
    expect(mockUpdateTransformation).not.toHaveBeenCalled();
  });

  it("should return 400 when body does not match schema", async () => {
    const response = await PUT(buildRequest({ id: "not-a-number" }));

    expect(response.status).toBe(400);
    expect(mockUpdateTransformation).not.toHaveBeenCalled();
  });

  it("should surface the error message in the body when an update is refused", async () => {
    mockUpdateTransformation.mockRejectedValueOnce(
      new ApiDomainError("Impossible de modifier une transformation finalisée")
    );

    const response = await PUT(buildRequest(validBody));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Impossible de modifier une transformation finalisée",
    });
  });
});
