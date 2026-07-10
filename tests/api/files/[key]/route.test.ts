import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, GET } from "@/app/api/files/[key]/route";

const mockGetServerSession = vi.fn();
const mockGetPrincipal = vi.fn();
const mockGetFileWithParents = vi.fn();
const mockAuthorizeFileAccess = vi.fn();
const mockGetDownloadLink = vi.fn();
const mockDeleteFile = vi.fn();
const mockDeleteFileByStorageKey = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({
  authOptions: {},
}));

vi.mock("@/app/api/files/file.service", () => ({
  getPrincipal: (...args: unknown[]) => mockGetPrincipal(...args),
  getFileWithParents: (...args: unknown[]) => mockGetFileWithParents(...args),
  authorizeFileAccess: (...args: unknown[]) =>
    mockAuthorizeFileAccess(...args),
  getDownloadLink: (...args: unknown[]) => mockGetDownloadLink(...args),
  deleteFile: (...args: unknown[]) => mockDeleteFile(...args),
  deleteFileByStorageKey: (...args: unknown[]) =>
    mockDeleteFileByStorageKey(...args),
}));

const linkedFile = {
  id: 1,
  key: "test.pdf",
  mimeType: "application/pdf",
  originalName: "test.pdf",
  fileSize: 10,
  documentFinancierId: 5,
  documentFinancier: { structure: { departementAdministratif: "75" } },
};

describe("GET /api/files/[key]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPrincipal.mockReturnValue({ type: "operateur" });
  });

  it("vérifie l'existence et l'autorisation avant de générer le lien de téléchargement", async () => {
    // GIVEN
    mockGetFileWithParents.mockResolvedValueOnce(linkedFile);
    mockAuthorizeFileAccess.mockReturnValueOnce(true);
    mockGetDownloadLink.mockResolvedValueOnce("https://s3.example.com/test.pdf");

    const request = new NextRequest(
      "http://localhost/api/files/test.pdf?getLink=1"
    );

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: "https://s3.example.com/test.pdf",
    });
    expect(mockGetFileWithParents).toHaveBeenCalledWith("test.pdf");
    expect(mockAuthorizeFileAccess).toHaveBeenCalledWith(
      { type: "operateur" },
      linkedFile,
      "read"
    );
    expect(mockGetDownloadLink).toHaveBeenCalled();
  });

  it("refuse le lien de téléchargement à un utilisateur non autorisé", async () => {
    // GIVEN
    mockGetFileWithParents.mockResolvedValueOnce(linkedFile);
    mockAuthorizeFileAccess.mockReturnValueOnce(false);

    const request = new NextRequest(
      "http://localhost/api/files/test.pdf?getLink=1"
    );

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(403);
    expect(mockGetDownloadLink).not.toHaveBeenCalled();
  });

  it("retourne 404 quand le fichier est introuvable", async () => {
    // GIVEN
    mockGetFileWithParents.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost/api/files/unknown.pdf");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(404);
    expect(mockAuthorizeFileAccess).not.toHaveBeenCalled();
  });

  it("retourne uniquement les métadonnées scalaires du fichier sans exposer les parents", async () => {
    // GIVEN
    mockGetFileWithParents.mockResolvedValueOnce(linkedFile);
    mockAuthorizeFileAccess.mockReturnValueOnce(true);

    const request = new NextRequest("http://localhost/api/files/test.pdf");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: 1,
      key: "test.pdf",
      mimeType: "application/pdf",
      originalName: "test.pdf",
      fileSize: 10,
    });
  });

  it("refuse la lecture des métadonnées à un utilisateur non autorisé", async () => {
    // GIVEN
    mockGetFileWithParents.mockResolvedValueOnce(linkedFile);
    mockAuthorizeFileAccess.mockReturnValueOnce(false);

    const request = new NextRequest("http://localhost/api/files/test.pdf");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(403);
  });
});

describe("DELETE /api/files/[key]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPrincipal.mockReturnValue({ type: "operateur" });
  });

  it("retourne 404 quand le fichier est introuvable", async () => {
    // GIVEN
    mockGetFileWithParents.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost/api/files/unknown.pdf", {
      method: "DELETE",
    });

    // WHEN
    const response = await DELETE(request);

    // THEN
    expect(response.status).toBe(404);
    expect(mockAuthorizeFileAccess).not.toHaveBeenCalled();
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("refuse la suppression à un utilisateur non autorisé", async () => {
    // GIVEN
    mockGetFileWithParents.mockResolvedValueOnce(linkedFile);
    mockAuthorizeFileAccess.mockReturnValueOnce(false);

    const request = new NextRequest("http://localhost/api/files/test.pdf", {
      method: "DELETE",
    });

    // WHEN
    const response = await DELETE(request);

    // THEN
    expect(response.status).toBe(403);
    expect(mockDeleteFile).not.toHaveBeenCalled();
    expect(mockDeleteFileByStorageKey).not.toHaveBeenCalled();
  });

  it("supprime le fichier quand l'utilisateur est autorisé", async () => {
    // GIVEN
    mockGetFileWithParents.mockResolvedValueOnce(linkedFile);
    mockAuthorizeFileAccess.mockReturnValueOnce(true);
    mockDeleteFile.mockResolvedValueOnce(undefined);
    mockDeleteFileByStorageKey.mockResolvedValueOnce(linkedFile);

    const request = new NextRequest("http://localhost/api/files/test.pdf", {
      method: "DELETE",
    });

    // WHEN
    const response = await DELETE(request);

    // THEN
    expect(response.status).toBe(200);
    expect(mockDeleteFile).toHaveBeenCalled();
    expect(mockDeleteFileByStorageKey).toHaveBeenCalledWith("test.pdf");
  });

  it("retourne 500 quand la suppression échoue", async () => {
    // GIVEN
    mockGetFileWithParents.mockResolvedValueOnce(linkedFile);
    mockAuthorizeFileAccess.mockReturnValueOnce(true);
    mockDeleteFile.mockRejectedValueOnce(new Error("S3 error"));

    const request = new NextRequest("http://localhost/api/files/test.pdf", {
      method: "DELETE",
    });

    // WHEN
    const response = await DELETE(request);

    // THEN
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Erreur lors de la suppression du fichier",
    });
    expect(mockDeleteFileByStorageKey).not.toHaveBeenCalled();
  });
});
