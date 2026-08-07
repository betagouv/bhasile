import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/anomalies/[id]/route";

const mockGetServerSession = vi.fn();
const mockCanUpdateDepartement = vi.fn();
const mockGetAnomalieForUpdate = vi.fn();
const mockSetAnomalieJustification = vi.fn();
const mockCreateStructureEvent = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/casl/abilities", () => ({
  canUpdateDepartement: (...args: unknown[]) =>
    mockCanUpdateDepartement(...args),
}));

vi.mock("@/app/api/anomalies/anomalie.service", () => ({
  getAnomalieForUpdate: (...args: unknown[]) =>
    mockGetAnomalieForUpdate(...args),
  setAnomalieJustification: (...args: unknown[]) =>
    mockSetAnomalieJustification(...args),
}));

vi.mock("@/app/api/user-action/user-action.service", () => ({
  createStructureEvent: (...args: unknown[]) =>
    mockCreateStructureEvent(...args),
}));

const buildRequest = (body: unknown): NextRequest =>
  new NextRequest("http://localhost/api/anomalies/1", {
    method: "PUT",
    body: JSON.stringify(body),
  });

const params = Promise.resolve({ id: "1" });

describe("PUT /api/anomalies/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { email: "agent@gouv.fr", role: "DEPARTEMENT" },
    });
    mockCanUpdateDepartement.mockReturnValue(true);
    mockGetAnomalieForUpdate.mockResolvedValue({
      structureId: 42,
      departementAdministratif: "50",
    });
  });

  it("refuse un utilisateur non authentifié", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await PUT(
      buildRequest({ isJustified: true, commentaire: "Vérifié" }),
      { params }
    );

    expect(response.status).toBe(401);
    expect(mockSetAnomalieJustification).not.toHaveBeenCalled();
  });

  it("refuse un agent hors de son département", async () => {
    mockCanUpdateDepartement.mockReturnValue(false);

    const response = await PUT(
      buildRequest({ isJustified: true, commentaire: "Vérifié" }),
      { params }
    );

    expect(response.status).toBe(403);
    expect(mockSetAnomalieJustification).not.toHaveBeenCalled();
  });

  it("rejette une justification vide", async () => {
    const response = await PUT(
      buildRequest({ isJustified: true, commentaire: "   " }),
      { params }
    );

    expect(response.status).toBe(400);
    expect(mockSetAnomalieJustification).not.toHaveBeenCalled();
  });

  it("rejette une justification de plus de 100 caractères", async () => {
    const response = await PUT(
      buildRequest({ isJustified: true, commentaire: "a".repeat(101) }),
      { params }
    );

    expect(response.status).toBe(400);
    expect(mockSetAnomalieJustification).not.toHaveBeenCalled();
  });

  it("renvoie 404 quand l'anomalie a disparu depuis le rendu", async () => {
    mockGetAnomalieForUpdate.mockResolvedValue(null);

    const response = await PUT(
      buildRequest({ isJustified: true, commentaire: "Vérifié" }),
      { params }
    );

    expect(response.status).toBe(404);
    expect(mockSetAnomalieJustification).not.toHaveBeenCalled();
  });

  it("ignore l'anomalie et journalise l'action", async () => {
    const response = await PUT(
      buildRequest({ isJustified: true, commentaire: "Vérifié" }),
      { params }
    );

    expect(response.status).toBe(200);
    expect(mockSetAnomalieJustification).toHaveBeenCalledWith(
      { id: 1, isJustified: true, commentaire: "Vérifié" },
      "agent@gouv.fr"
    );
    expect(mockCreateStructureEvent).toHaveBeenCalledWith("PUT", 42);
  });

  it("rouvre une anomalie sans exiger de justification", async () => {
    const response = await PUT(
      buildRequest({ isJustified: false, commentaire: null }),
      { params }
    );

    expect(response.status).toBe(200);
    expect(mockSetAnomalieJustification).toHaveBeenCalledWith(
      { id: 1, isJustified: false, commentaire: null },
      "agent@gouv.fr"
    );
  });
});
