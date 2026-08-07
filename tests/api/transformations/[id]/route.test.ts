import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/api/transformations/[id]/route";
import { ApiDomainError } from "@/app/utils/apiDomainError.util";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const mockGetTransformation = vi.fn();
const mockUpdateTransformation = vi.fn();
const mockDeleteTransformation = vi.fn();
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

describe("GET /api/transformations/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 200 avec la transformation sérialisée", async () => {
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

  it("retourne 404 quand la transformation est introuvable", async () => {
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
    mockGetServerSession.mockResolvedValue({ user: agentParis });
    mockGetTransformation.mockResolvedValue({
      id: 7,
      type: TransformationType.FERMETURE_SANS_TRANSFERT,
      structureVersionTransformations: [
        buildStructureVersionTransformation("75"),
      ],
    });
  });

  it("retourne 201 quand le corps est valide et que l'utilisateur est autorisé", async () => {
    mockUpdateTransformation.mockResolvedValueOnce(7);

    const response = await PUT(buildRequest(validBody));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ transformationId: 7 });
    expect(mockUpdateTransformation).toHaveBeenCalledWith(validBody);
  });

  it("retourne 401 quand l'utilisateur n'est pas authentifié", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const response = await PUT(buildRequest(validBody));

    expect(response.status).toBe(401);
    expect(mockUpdateTransformation).not.toHaveBeenCalled();
  });

  it("retourne 403 quand la transformation stockée est hors du périmètre de l'agent", async () => {
    mockGetTransformation.mockResolvedValueOnce({
      id: 7,
      type: TransformationType.FERMETURE_SANS_TRANSFERT,
      structureVersionTransformations: [
        buildStructureVersionTransformation("92"),
      ],
    });

    const response = await PUT(buildRequest(validBody));

    expect(response.status).toBe(403);
    expect(mockUpdateTransformation).not.toHaveBeenCalled();
  });

  it("retourne 403 quand le corps déclare un département hors du périmètre de l'agent", async () => {
    const response = await PUT(
      buildRequest({
        ...validBody,
        structureVersionTransformations: [
          buildStructureVersionTransformation("92"),
        ],
      })
    );

    expect(response.status).toBe(403);
    expect(mockUpdateTransformation).not.toHaveBeenCalled();
  });

  it("autorise une création ex-nihilo dont le département arrive avec le corps", async () => {
    mockGetTransformation.mockResolvedValueOnce({
      id: 7,
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [
        { type: StructureVersionTransformationType.CREATION },
      ],
    });
    mockUpdateTransformation.mockResolvedValueOnce(7);

    const response = await PUT(
      buildRequest({
        ...validBody,
        structureVersionTransformations: [
          {
            type: StructureVersionTransformationType.CREATION,
            structureVersion: { departementAdministratif: "75" },
          },
        ],
      })
    );

    expect(response.status).toBe(201);
  });

  it("autorise une transformation sans département, encore à l'état de brouillon", async () => {
    mockGetTransformation.mockResolvedValueOnce({
      id: 7,
      type: TransformationType.FERMETURE_SANS_TRANSFERT,
      structureVersionTransformations: [
        { type: StructureVersionTransformationType.CREATION },
      ],
    });
    mockUpdateTransformation.mockResolvedValueOnce(7);

    const response = await PUT(buildRequest(validBody));

    expect(response.status).toBe(201);
  });

  it("retourne 404 quand la transformation n'existe pas", async () => {
    mockGetTransformation.mockResolvedValueOnce(null);

    const response = await PUT(buildRequest(validBody));

    expect(response.status).toBe(404);
    expect(mockUpdateTransformation).not.toHaveBeenCalled();
  });

  it("retourne 400 quand le corps ne respecte pas le schéma", async () => {
    const response = await PUT(buildRequest({ id: "not-a-number" }));

    expect(response.status).toBe(400);
    expect(mockUpdateTransformation).not.toHaveBeenCalled();
  });

  it("expose le message d'erreur dans le corps quand une modification est refusée", async () => {
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
