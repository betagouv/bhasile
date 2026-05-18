import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
