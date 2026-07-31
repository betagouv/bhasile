import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/transformations/route";
import {
  StructureVersionTransformationType,
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

  it("retourne 201 et l'id de la transformation quand le corps est valide", async () => {
    mockCreateTransformation.mockResolvedValueOnce(99);
    const body = {
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.CREATION,
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

  it("retourne 400 quand le corps ne respecte pas le schéma", async () => {
    const request = new Request("http://localhost/api/transformations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: TransformationType.OUVERTURE_EX_NIHILO,
        structureVersionTransformations: [],
      }),
    });

    const response = await POST(request as NextRequest);

    expect(response.status).toBe(400);
    expect(mockCreateTransformation).not.toHaveBeenCalled();
  });
});
