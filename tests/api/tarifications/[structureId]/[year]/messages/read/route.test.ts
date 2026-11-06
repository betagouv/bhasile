import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/tarifications/[structureId]/[year]/messages/read/route";

const mockGetServerSession = vi.fn();
const mockGetTarificationParticipant = vi.fn();
const mockMarkTarificationMessagesAsRead = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

vi.mock("@/app/api/tarifications/tarification.service", () => ({
  getTarificationParticipant: (...args: unknown[]) =>
    mockGetTarificationParticipant(...args),
  markTarificationMessagesAsRead: (...args: unknown[]) =>
    mockMarkTarificationMessagesAsRead(...args),
}));

const participant = { id: 3, level: "DEPARTEMENT" };
const params = Promise.resolve({ structureId: "42", year: "2027" });

const buildRequest = (body: unknown): NextRequest =>
  new NextRequest("http://localhost/api/tarifications/42/2027/messages/read", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("POST /api/tarifications/[structureId]/[year]/messages/read", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { email: "agent@gouv.fr" },
    });
    mockGetTarificationParticipant.mockResolvedValue(participant);
    mockMarkTarificationMessagesAsRead.mockResolvedValue({ count: 2 });
  });

  it("rejette une liste de messages vide", async () => {
    const response = await POST(
      buildRequest({ visibility: "SHARED", messageIds: [] }),
      { params }
    );

    expect(response.status).toBe(400);
  });

  it("enregistre la lecture des messages pour le lecteur", async () => {
    const response = await POST(
      buildRequest({ visibility: "SHARED", messageIds: [1, 2] }),
      { params }
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ count: 2 });
    expect(mockMarkTarificationMessagesAsRead).toHaveBeenCalledWith({
      structureId: 42,
      year: 2027,
      reader: participant,
      visibility: "SHARED",
      messageIds: [1, 2],
    });
  });
});
