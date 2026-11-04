import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/tarifications/[structureId]/[year]/events/route";
import { DomainError } from "@/app/utils/domain-error.util";

const mockGetServerSession = vi.fn();
const mockGetTarificationParticipant = vi.fn();
const mockRecordTarificationEvent = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

vi.mock("@/app/api/tarifications/tarification.service", () => ({
  getTarificationParticipant: (...args: unknown[]) =>
    mockGetTarificationParticipant(...args),
  recordTarificationEvent: (...args: unknown[]) =>
    mockRecordTarificationEvent(...args),
}));

const participant = { id: 3, level: "DEPARTEMENT" };
const params = Promise.resolve({ structureId: "42", year: "2027" });

const postEvent = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/tarifications/42/2027/events", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    { params }
  );

describe("POST /api/tarifications/[structureId]/[year]/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { email: "agent@gouv.fr" },
    });
    mockGetTarificationParticipant.mockResolvedValue(participant);
    mockRecordTarificationEvent.mockResolvedValue({ id: 9 });
  });

  it("refuse un utilisateur non authentifié", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await postEvent({
      type: "DOCUMENT_SHARED",
      documentId: 1,
    });

    expect(response.status).toBe(401);
  });

  it("enregistre le fait au nom du participant, avec les valeurs par défaut", async () => {
    const response = await postEvent({
      type: "DOCUMENT_SHARED",
      documentId: 1,
    });

    expect(response.status).toBe(201);
    expect(mockRecordTarificationEvent).toHaveBeenCalledWith({
      structureId: 42,
      year: 2027,
      author: participant,
      type: "DOCUMENT_SHARED",
      documentId: 1,
      fileKey: null,
      stepCode: null,
      text: null,
    });
  });

  it("nettoie le texte, et traite un texte vide comme absent", async () => {
    await postEvent({
      type: "CHANGES_REQUESTED",
      documentId: 1,
      text: "  Oui ",
    });
    await postEvent({ type: "CHANGES_REQUESTED", documentId: 1, text: "   " });

    expect(mockRecordTarificationEvent.mock.calls[0][0].text).toBe("Oui");
    expect(mockRecordTarificationEvent.mock.calls[1][0].text).toBeNull();
  });

  it("transmet le fichier joint à une réponse à la L48", async () => {
    const response = await postEvent({
      type: "L48_CONTESTED",
      text: "Montant erroné",
      fileKey: "reponse.pdf",
    });

    expect(response.status).toBe(201);
    expect(mockRecordTarificationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "L48_CONTESTED",
        fileKey: "reponse.pdf",
        documentId: null,
      })
    );
  });

  it.each([
    { type: "DOCUMENT_SHARED", documentId: 1, fileKey: "piece.pdf" },
    { type: "L48_ACCEPTED", documentId: 1, fileKey: "reponse.pdf" },
  ])("refuse un fichier hors d'une réponse à la L48 : $type", async (body) => {
    const response = await postEvent(body);

    expect(response.status).toBe(400);
    expect(mockRecordTarificationEvent).not.toHaveBeenCalled();
  });

  it("ne laisse pas écrire un dépôt par cette route", async () => {
    const response = await postEvent({
      type: "DOCUMENT_DEPOSITED",
      documentId: 1,
    });

    expect(response.status).toBe(400);
    expect(mockRecordTarificationEvent).not.toHaveBeenCalled();
  });

  it("renvoie le statut d'une règle de domaine refusée", async () => {
    mockRecordTarificationEvent.mockRejectedValue(
      new DomainError("Déjà partagé", 409)
    );

    const response = await postEvent({
      type: "DOCUMENT_SHARED",
      documentId: 1,
    });

    expect(response.status).toBe(409);
  });
});
