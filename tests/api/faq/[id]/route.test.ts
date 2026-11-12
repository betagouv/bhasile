import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, PUT } from "@/app/api/faq/[id]/route";
import { DomainError } from "@/app/utils/domain-error.util";

const mockGetServerSession = vi.fn();
const mockCanAccessCockpitAdmin = vi.fn();
const mockEditFaqItem = vi.fn();
const mockRemoveFaqItem = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/casl", () => ({
  canAccessCockpitAdmin: (...args: unknown[]) =>
    mockCanAccessCockpitAdmin(...args),
}));

vi.mock("@/app/api/faq/faq.service", () => ({
  editFaqItem: (...args: unknown[]) => mockEditFaqItem(...args),
  removeFaqItem: (...args: unknown[]) => mockRemoveFaqItem(...args),
}));

const faqItem = {
  question: "Comment déclarer une fermeture ?",
  contentMarkdown: "Depuis la fiche structure.",
  category: "Structures",
};

const buildRequest = (method: string, body?: unknown): NextRequest =>
  new NextRequest("http://localhost/api/faq/3", {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const paramsFor = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/faq/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { email: "admin@test.fr" },
    });
    mockCanAccessCockpitAdmin.mockReturnValue(true);
  });

  describe("PUT", () => {
    it("refuse un utilisateur sans accès au cockpit admin", async () => {
      mockCanAccessCockpitAdmin.mockReturnValue(false);

      const response = await PUT(buildRequest("PUT", faqItem), paramsFor("3"));

      expect(response.status).toBe(403);
      expect(mockEditFaqItem).not.toHaveBeenCalled();
    });

    it("renvoie une 404 pour un identifiant invalide", async () => {
      const response = await PUT(
        buildRequest("PUT", faqItem),
        paramsFor("abc")
      );

      expect(response.status).toBe(404);
      expect(mockEditFaqItem).not.toHaveBeenCalled();
    });

    it("renvoie une 404 pour une question introuvable", async () => {
      mockEditFaqItem.mockRejectedValueOnce(
        new DomainError("Question introuvable", 404)
      );

      const response = await PUT(buildRequest("PUT", faqItem), paramsFor("3"));

      expect(response.status).toBe(404);
    });

    it("met à jour la question", async () => {
      const response = await PUT(buildRequest("PUT", faqItem), paramsFor("3"));

      expect(response.status).toBe(200);
      expect(mockEditFaqItem).toHaveBeenCalledWith(3, faqItem);
    });
  });

  describe("DELETE", () => {
    it("refuse un utilisateur non authentifié", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await DELETE(buildRequest("DELETE"), paramsFor("3"));

      expect(response.status).toBe(401);
      expect(mockRemoveFaqItem).not.toHaveBeenCalled();
    });

    it("refuse un utilisateur sans accès au cockpit admin", async () => {
      mockCanAccessCockpitAdmin.mockReturnValue(false);

      const response = await DELETE(buildRequest("DELETE"), paramsFor("3"));

      expect(response.status).toBe(403);
      expect(mockRemoveFaqItem).not.toHaveBeenCalled();
    });

    it("supprime la question", async () => {
      const response = await DELETE(buildRequest("DELETE"), paramsFor("3"));

      expect(response.status).toBe(200);
      expect(mockRemoveFaqItem).toHaveBeenCalledWith(3);
    });
  });
});
