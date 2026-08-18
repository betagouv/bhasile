import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/transformations/[id]/route";
import { DomainError } from "@/app/utils/domainError.util";
import { TransformationType } from "@/types/transformation.type";

const mockGetTransformation = vi.fn();
const mockUpdateTransformation = vi.fn();
const mockDeleteTransformation = vi.fn();
const mockGetServerSession = vi.fn();

const agentParis = { role: "DEPARTEMENT_PARIS", allowedDepartements: ["75"] };

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

  const storedTransformation = {
    id: 7,
    type: TransformationType.FERMETURE_SANS_TRANSFERT,
    structureVersionTransformations: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: agentParis });
    mockGetTransformation.mockResolvedValue(storedTransformation);
  });

  it("retourne 201 et transmet la transformation stockée et l'agent au service", async () => {
    mockUpdateTransformation.mockResolvedValueOnce(7);

    const response = await PUT(buildRequest(validBody));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ transformationId: 7 });
    expect(mockUpdateTransformation).toHaveBeenCalledWith(
      validBody,
      storedTransformation,
      agentParis
    );
  });

  it("retourne 401 quand l'utilisateur n'est pas authentifié", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const response = await PUT(buildRequest(validBody));

    expect(response.status).toBe(401);
    expect(mockUpdateTransformation).not.toHaveBeenCalled();
  });

  it("retourne 403 quand le service refuse le département", async () => {
    mockUpdateTransformation.mockRejectedValueOnce(
      new DomainError("Le département 92 n'est pas dans votre périmètre.", 403)
    );

    const response = await PUT(buildRequest(validBody));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Le département 92 n'est pas dans votre périmètre.",
    });
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
      new DomainError("Impossible de modifier une transformation finalisée")
    );

    const response = await PUT(buildRequest(validBody));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Impossible de modifier une transformation finalisée",
    });
  });
});
