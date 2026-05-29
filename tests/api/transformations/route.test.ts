import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/transformations/route";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const mockCreateTransformation = vi.fn();

vi.mock("@/app/api/transformations/transformation.service", () => ({
  createTransformation: (...args: unknown[]) =>
    mockCreateTransformation(...args),
}));

describe("POST /api/transformations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 201 and transformation id when body is valid", async () => {
    mockCreateTransformation.mockResolvedValueOnce(99);
    const body = {
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureTransformations: [
        {
          type: StructureTransformationType.CREATION,
          structureVersion: { structureId: 1 },
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
    expect(await response.json()).toEqual({ transformationId: 99 });
    expect(mockCreateTransformation).toHaveBeenCalledWith(body);
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
    expect(mockCreateTransformation).not.toHaveBeenCalled();
  });
});
