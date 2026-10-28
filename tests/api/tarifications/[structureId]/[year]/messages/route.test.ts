import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET,
  POST,
} from "@/app/api/tarifications/[structureId]/[year]/messages/route";
import { DomainError } from "@/app/utils/domain-error.util";

const mockGetServerSession = vi.fn();
const mockGetTarificationParticipant = vi.fn();
const mockGetTarificationReader = vi.fn();
const mockGetTarificationMessages = vi.fn();
const mockPostTarificationMessage = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

vi.mock("@/app/api/tarifications/tarification.service", () => ({
  getTarificationParticipant: (...args: unknown[]) =>
    mockGetTarificationParticipant(...args),
  getTarificationReader: (...args: unknown[]) =>
    mockGetTarificationReader(...args),
  getTarificationMessages: (...args: unknown[]) =>
    mockGetTarificationMessages(...args),
  postTarificationMessage: (...args: unknown[]) =>
    mockPostTarificationMessage(...args),
}));

const participant = { id: 3, level: "DEPARTEMENT", isSuperAdmin: false };
const reader = { isAgent: true };
const params = Promise.resolve({ structureId: "42", year: "2027" });

const buildGetRequest = (visibility: string): NextRequest =>
  new NextRequest(
    `http://localhost/api/tarifications/42/2027/messages?visibility=${visibility}`
  );

const buildPostRequest = (body: unknown): NextRequest =>
  new NextRequest("http://localhost/api/tarifications/42/2027/messages", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("GET /api/tarifications/[structureId]/[year]/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { email: "agent@gouv.fr" },
    });
    mockGetTarificationReader.mockResolvedValue(reader);
    mockGetTarificationMessages.mockResolvedValue([{ id: 1, text: "Bonjour" }]);
  });

  it("refuse un utilisateur non authentifié", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await GET(buildGetRequest("SHARED"), { params });

    expect(response.status).toBe(401);
  });

  it("rejette un canal inconnu", async () => {
    const response = await GET(buildGetRequest("TOUS"), { params });

    expect(response.status).toBe(400);
    expect(mockGetTarificationMessages).not.toHaveBeenCalled();
  });

  it("renvoie toute la conversation du canal demandé", async () => {
    const response = await GET(buildGetRequest("AGENTS"), { params });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: 1, text: "Bonjour" }]);
    expect(mockGetTarificationMessages).toHaveBeenCalledWith({
      structureId: 42,
      year: 2027,
      visibility: "AGENTS",
      reader,
    });
  });

  it("renvoie le refus d'accès du service", async () => {
    mockGetTarificationReader.mockRejectedValue(
      new DomainError("Accès refusé à la tarification de la structure", 403)
    );

    const response = await GET(buildGetRequest("SHARED"), { params });

    expect(response.status).toBe(403);
  });
});

describe("POST /api/tarifications/[structureId]/[year]/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { email: "agent@gouv.fr" },
    });
    mockGetTarificationParticipant.mockResolvedValue(participant);
    mockPostTarificationMessage.mockResolvedValue({ id: 9 });
  });

  it("rejette un message sans texte ni pièce jointe", async () => {
    const response = await POST(
      buildPostRequest({ visibility: "SHARED", text: "   " }),
      { params }
    );

    expect(response.status).toBe(400);
    expect(mockPostTarificationMessage).not.toHaveBeenCalled();
  });

  it("accepte un message fait seulement de pièces jointes", async () => {
    const response = await POST(
      buildPostRequest({
        visibility: "SHARED",
        text: "",
        fileKeys: ["abc-justificatif.pdf"],
      }),
      { params }
    );

    expect(response.status).toBe(201);
  });

  it("crée le message avec un texte rogné et les valeurs par défaut", async () => {
    const response = await POST(
      buildPostRequest({ visibility: "AGENTS", text: "  Bonjour  " }),
      { params }
    );

    expect(response.status).toBe(201);
    expect(mockPostTarificationMessage).toHaveBeenCalledWith({
      structureId: 42,
      year: 2027,
      author: participant,
      visibility: "AGENTS",
      text: "Bonjour",
      tagKey: null,
      fileKeys: [],
    });
  });

  it("rejette un texte trop long", async () => {
    const response = await POST(
      buildPostRequest({ visibility: "SHARED", text: "a".repeat(10_001) }),
      { params }
    );

    expect(response.status).toBe(400);
  });
});
