import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/tarifications/[structureId]/[year]/documents/route";
import { DomainError } from "@/app/utils/domain-error.util";

const mockGetServerSession = vi.fn();
const mockGetTarificationParticipant = vi.fn();
const mockDepositTarificationDocument = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

vi.mock("@/app/api/tarifications/tarification.service", () => ({
  getTarificationParticipant: (...args: unknown[]) =>
    mockGetTarificationParticipant(...args),
  depositTarificationDocument: (...args: unknown[]) =>
    mockDepositTarificationDocument(...args),
}));

const participant = { id: 3, level: "OPERATEUR" };
const params = Promise.resolve({ structureId: "42", year: "2027" });
const validBody = { fileKey: "abc-ca.pdf", types: ["CA"], status: "FINAL" };

const postDocument = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/tarifications/42/2027/documents", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    { params }
  );

describe("POST /api/tarifications/[structureId]/[year]/documents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { email: "operateur@test.fr" },
    });
    mockGetTarificationParticipant.mockResolvedValue(participant);
    mockDepositTarificationDocument.mockResolvedValue({ id: 9 });
  });

  it("refuse un utilisateur non authentifié", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await postDocument(validBody);

    expect(response.status).toBe(401);
    expect(mockDepositTarificationDocument).not.toHaveBeenCalled();
  });

  it("dépose le document au nom du participant", async () => {
    const response = await postDocument(validBody);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: 9 });
    expect(mockDepositTarificationDocument).toHaveBeenCalledWith({
      structureId: 42,
      year: 2027,
      author: participant,
      ...validBody,
    });
  });

  it("rejette un document sans type, ou avec un type en double", async () => {
    expect((await postDocument({ ...validBody, types: [] })).status).toBe(400);
    expect(
      (await postDocument({ ...validBody, types: ["CA", "CA"] })).status
    ).toBe(400);
    expect(mockDepositTarificationDocument).not.toHaveBeenCalled();
  });

  it("rejette un type inconnu", async () => {
    const response = await postDocument({ ...validBody, types: ["INCONNU"] });

    expect(response.status).toBe(400);
  });

  it("renvoie le statut d'une règle de domaine refusée", async () => {
    mockDepositTarificationDocument.mockRejectedValue(
      new DomainError("Pas ouvert", 409)
    );

    const response = await postDocument(validBody);

    expect(response.status).toBe(409);
  });
});
