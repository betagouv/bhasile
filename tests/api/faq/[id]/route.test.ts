import { NextRequest } from "next/server";
import { createFaqItemValues } from "tests/test-utils/factories/faq.factory";
import {
  createNationalAgent,
  createSessionUser,
} from "tests/test-utils/factories/session-user.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, PUT } from "@/app/api/faq/[id]/route";
import { faqItemNotFound } from "@/app/api/faq/faq.util";

const mockGetServerSession = vi.fn();
const mockEditFaqItem = vi.fn();
const mockRemoveFaqItem = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

vi.mock("@/app/api/faq/faq.service", () => ({
  editFaqItem: (...args: unknown[]) => mockEditFaqItem(...args),
  removeFaqItem: (...args: unknown[]) => mockRemoveFaqItem(...args),
}));

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
      user: createSessionUser({ isSuperAdmin: true }),
    });
  });

  describe("PUT", () => {
    it("refuse un agent qui n'est pas super admin", async () => {
      mockGetServerSession.mockResolvedValue({ user: createNationalAgent() });

      const response = await PUT(
        buildRequest("PUT", createFaqItemValues()),
        paramsFor("3")
      );

      expect(response.status).toBe(403);
      expect(mockEditFaqItem).not.toHaveBeenCalled();
    });

    it("renvoie une 404 pour un identifiant invalide", async () => {
      const response = await PUT(
        buildRequest("PUT", createFaqItemValues()),
        paramsFor("abc")
      );

      expect(response.status).toBe(404);
      expect(mockEditFaqItem).not.toHaveBeenCalled();
    });

    it("renvoie une 404 pour une question introuvable", async () => {
      mockEditFaqItem.mockRejectedValueOnce(faqItemNotFound());

      const response = await PUT(
        buildRequest("PUT", createFaqItemValues()),
        paramsFor("3")
      );

      expect(response.status).toBe(404);
    });

    it("met à jour la question", async () => {
      const response = await PUT(
        buildRequest("PUT", createFaqItemValues()),
        paramsFor("3")
      );

      expect(response.status).toBe(200);
      expect(mockEditFaqItem).toHaveBeenCalledWith(3, createFaqItemValues());
    });
  });

  describe("DELETE", () => {
    it("refuse un utilisateur non authentifié", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await DELETE(buildRequest("DELETE"), paramsFor("3"));

      expect(response.status).toBe(401);
      expect(mockRemoveFaqItem).not.toHaveBeenCalled();
    });

    it("refuse un agent qui n'est pas super admin", async () => {
      mockGetServerSession.mockResolvedValue({ user: createNationalAgent() });

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
