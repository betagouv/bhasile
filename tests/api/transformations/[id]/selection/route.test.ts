import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/transformations/[id]/selection/route";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const mockGetTransformation = vi.fn();
const mockResetTransformationSelection = vi.fn();
const mockGetServerSession = vi.fn();

const agentParis = { role: "DEPARTEMENT_PARIS", allowedDepartements: ["75"] };

const buildStructureVersionTransformation = (
  departementAdministratif: string
) => ({
  type: StructureVersionTransformationType.FERMETURE,
  structureVersion: { departementAdministratif },
});

vi.mock("@/app/api/transformations/transformation.service", () => ({
  getTransformation: (...args: unknown[]) => mockGetTransformation(...args),
  resetTransformationSelection: (...args: unknown[]) =>
    mockResetTransformationSelection(...args),
}));

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({
  authOptions: {},
}));

describe("PUT /api/transformations/[id]/selection", () => {
  const validBody = {
    type: TransformationType.FERMETURE_SANS_TRANSFERT,
    structureVersionTransformations: [
      {
        type: StructureVersionTransformationType.FERMETURE,
        structureVersion: { structureId: 1 },
      },
    ],
  };

  const buildRequest = (body: unknown) =>
    new Request("http://localhost/api/transformations/7/selection", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as NextRequest;

  const params = Promise.resolve({ id: "7" });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: agentParis });
    mockGetTransformation.mockResolvedValue({
      id: 7,
      type: TransformationType.FERMETURE_SANS_TRANSFERT,
      structureVersionTransformations: [
        buildStructureVersionTransformation("75"),
      ],
    });
  });

  it("retourne 200 et transmet l'agent au service", async () => {
    mockResetTransformationSelection.mockResolvedValueOnce(7);

    const response = await PUT(buildRequest(validBody), { params });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ transformationId: 7 });
    expect(mockResetTransformationSelection).toHaveBeenCalledWith(
      { ...validBody, id: 7 },
      agentParis
    );
  });

  it("retourne 401 quand l'utilisateur n'est pas authentifié", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const response = await PUT(buildRequest(validBody), { params });

    expect(response.status).toBe(401);
    expect(mockResetTransformationSelection).not.toHaveBeenCalled();
  });

  it("retourne 403 quand la transformation stockée est hors du périmètre de l'agent", async () => {
    mockGetTransformation.mockResolvedValueOnce({
      id: 7,
      type: TransformationType.FERMETURE_SANS_TRANSFERT,
      structureVersionTransformations: [
        buildStructureVersionTransformation("92"),
      ],
    });

    const response = await PUT(buildRequest(validBody), { params });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Le département 92 n'est pas dans votre périmètre.",
    });
    expect(mockResetTransformationSelection).not.toHaveBeenCalled();
  });

  it("retourne 404 quand la transformation n'existe pas", async () => {
    mockGetTransformation.mockResolvedValueOnce(null);

    const response = await PUT(buildRequest(validBody), { params });

    expect(response.status).toBe(404);
    expect(mockResetTransformationSelection).not.toHaveBeenCalled();
  });

  it("retourne 400 quand le corps ne respecte pas le schéma", async () => {
    const response = await PUT(
      buildRequest({ ...validBody, structureVersionTransformations: [] }),
      { params }
    );

    expect(response.status).toBe(400);
    expect(mockResetTransformationSelection).not.toHaveBeenCalled();
  });
});
