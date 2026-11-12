import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/faq/route";

const mockGetServerSession = vi.fn();
const mockCanAccessCockpitAdmin = vi.fn();
const mockAddFaqItem = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/casl", () => ({
  canAccessCockpitAdmin: (...args: unknown[]) =>
    mockCanAccessCockpitAdmin(...args),
}));

vi.mock("@/app/api/faq/faq.service", () => ({
  addFaqItem: (...args: unknown[]) => mockAddFaqItem(...args),
}));

const faqItem = {
  question: "Comment déclarer une fermeture ?",
  contentMarkdown: "Depuis la fiche structure.",
  category: "Structures",
};

const buildRequest = (body: unknown): NextRequest =>
  new NextRequest("http://localhost/api/faq", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("POST /api/faq", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { email: "admin@test.fr" },
    });
    mockCanAccessCockpitAdmin.mockReturnValue(true);
    mockAddFaqItem.mockResolvedValue(12);
  });

  it("refuse un utilisateur non authentifié", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await POST(buildRequest(faqItem));

    expect(response.status).toBe(401);
    expect(mockAddFaqItem).not.toHaveBeenCalled();
  });

  it("refuse un utilisateur sans accès au cockpit admin", async () => {
    mockCanAccessCockpitAdmin.mockReturnValue(false);

    const response = await POST(buildRequest(faqItem));

    expect(response.status).toBe(403);
    expect(mockAddFaqItem).not.toHaveBeenCalled();
  });

  it("rejette une question vide", async () => {
    const response = await POST(buildRequest({ ...faqItem, question: "  " }));

    expect(response.status).toBe(400);
    expect(mockAddFaqItem).not.toHaveBeenCalled();
  });

  it("crée la question, débarrassée des espaces superflus", async () => {
    const response = await POST(
      buildRequest({ ...faqItem, category: " Structures " })
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ faqItemId: 12 });
    expect(mockAddFaqItem).toHaveBeenCalledWith(faqItem);
  });
});
