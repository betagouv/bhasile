// @vitest-environment node

import { NextRequest } from "next/server";
import {
  createNationalAgent,
  createSessionUser,
} from "tests/test-utils/factories/session-user.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as preview } from "@/app/api/ofii-imports/preview/route";
import { POST as apply } from "@/app/api/ofii-imports/route";

const mockGetServerSession = vi.fn();
const mockPreviewOfiiImport = vi.fn();
const mockApplyOfiiImport = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

vi.mock("@/app/api/ofii-imports/ofii-import.service", () => ({
  previewOfiiImport: (...args: unknown[]) => mockPreviewOfiiImport(...args),
  applyOfiiImport: (...args: unknown[]) => mockApplyOfiiImport(...args),
}));

const XLSX_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const buildRequest = (file?: File): NextRequest => {
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  }
  return new NextRequest("http://localhost/api/ofii-imports", {
    method: "POST",
    body: formData,
  });
};

const ofiiFile = new File(["contenu"], "Liste 10.25.xlsx", { type: XLSX_TYPE });

describe("/api/ofii-imports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: createSessionUser({ isSuperAdmin: true }),
    });
  });

  it.each([
    ["l'aperçu", preview],
    ["l'import", apply],
  ])("refuse %s à un agent qui n'est pas super admin", async (_, post) => {
    mockGetServerSession.mockResolvedValue({ user: createNationalAgent() });

    expect((await post(buildRequest(ofiiFile))).status).toBe(403);
    expect(mockPreviewOfiiImport).not.toHaveBeenCalled();
    expect(mockApplyOfiiImport).not.toHaveBeenCalled();
  });

  it("rejette une requête sans fichier", async () => {
    expect((await preview(buildRequest())).status).toBe(400);
  });

  it("rejette un fichier qui n'est pas un tableur", async () => {
    const pdf = new File(["%PDF"], "liste.pdf", { type: "application/pdf" });

    expect((await apply(buildRequest(pdf))).status).toBe(400);
    expect(mockApplyOfiiImport).not.toHaveBeenCalled();
  });

  it("transmet le fichier au service et renvoie son résultat", async () => {
    const result = { summary: "1 structures importées" };
    mockApplyOfiiImport.mockResolvedValue(result);

    const response = await apply(buildRequest(ofiiFile));

    expect(await response.json()).toEqual(result);
    expect(mockApplyOfiiImport).toHaveBeenCalledWith(
      expect.objectContaining({
        buffer: expect.any(Buffer),
        fileName: "Liste 10.25.xlsx",
      })
    );
  });
});
