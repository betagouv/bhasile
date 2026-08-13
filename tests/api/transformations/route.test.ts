import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/transformations/route";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const mockCreateTransformation = vi.fn();
const mockGetServerSession = vi.fn();

const agentParis = { role: "DEPARTEMENT_PARIS", allowedDepartements: ["75"] };

vi.mock("@/app/api/transformations/transformation.service", () => ({
  createTransformation: (...args: unknown[]) =>
    mockCreateTransformation(...args),
}));

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({
  authOptions: {},
}));

describe("POST /api/transformations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: agentParis });
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
    expect(mockCreateTransformation).toHaveBeenCalledWith(body, agentParis);
  });

  it("retourne 401 quand l'utilisateur n'est pas authentifié", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const request = new Request("http://localhost/api/transformations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: TransformationType.OUVERTURE_EX_NIHILO,
        structureVersionTransformations: [
          {
            type: StructureVersionTransformationType.CREATION,
            structureVersion: { structureId: 1 },
          },
        ],
      }),
    });

    const response = await POST(request as NextRequest);

    expect(response.status).toBe(401);
    expect(mockCreateTransformation).not.toHaveBeenCalled();
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
