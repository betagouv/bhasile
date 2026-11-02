import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, GET } from "@/app/api/files/[key]/route";
import { DomainError } from "@/app/utils/domain-error.util";

const mockGetServerSession = vi.fn();
const mockGetPrincipal = vi.fn();
const mockGetFileWithParents = vi.fn();
const mockAuthorizeFileAccess = vi.fn();
const mockAuthorizeTarificationDocument = vi.fn();
const mockRecordTarificationDocumentOpening = vi.fn();
const mockGetDownloadLink = vi.fn();
const mockGetInlineLink = vi.fn();
const mockDeleteFile = vi.fn();
const mockDeleteFileByStorageKey = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({
  authOptions: {},
}));

vi.mock("@/app/api/tarifications/tarification.service", () => ({
  authorizeTarificationDocument: (...args: unknown[]) =>
    mockAuthorizeTarificationDocument(...args),
  recordTarificationDocumentOpening: (...args: unknown[]) =>
    mockRecordTarificationDocumentOpening(...args),
}));

vi.mock("@/app/api/files/file.service", () => ({
  getPrincipal: (...args: unknown[]) => mockGetPrincipal(...args),
  getFileWithParents: (...args: unknown[]) => mockGetFileWithParents(...args),
  authorizeFileAccess: (...args: unknown[]) =>
    mockAuthorizeFileAccess(...args),
  getDownloadLink: (...args: unknown[]) => mockGetDownloadLink(...args),
  getInlineLink: (...args: unknown[]) => mockGetInlineLink(...args),
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

  describe("document de tarification", () => {
    const tarificationDocument = {
      id: 7,
      structureTarification: { structureId: 1, campaign: { year: 2027 } },
    };
    const tarificationFile = { ...linkedFile, tarificationDocument };
    const session = { user: { email: "utilisateur@test.fr" } };
    const pendingOpening = { documentId: 7, userId: 50 };
    const linkRequest = () =>
      new NextRequest("http://localhost/api/files/test.pdf?getLink=1");

    beforeEach(() => {
      mockGetServerSession.mockResolvedValueOnce(session);
      mockGetFileWithParents.mockResolvedValueOnce(tarificationFile);
    });

    it("confie la décision à la tarification et délivre le lien", async () => {
      mockAuthorizeTarificationDocument.mockResolvedValueOnce(null);
      mockGetDownloadLink.mockResolvedValueOnce("https://s3.example.com/x");

      const response = await GET(linkRequest());

      expect(response.status).toBe(200);
      expect(mockAuthorizeTarificationDocument).toHaveBeenCalledWith({
        user: session.user,
        document: tarificationDocument,
      });
      expect(mockAuthorizeFileAccess).not.toHaveBeenCalled();
      expect(await response.json()).toEqual({
        url: "https://s3.example.com/x",
      });
      expect(mockRecordTarificationDocumentOpening).not.toHaveBeenCalled();
    });

    it("retourne 404 quand la tarification refuse le document", async () => {
      mockAuthorizeTarificationDocument.mockRejectedValueOnce(
        new DomainError("Aucun fichier trouvé", 404)
      );

      const response = await GET(linkRequest());

      expect(response.status).toBe(404);
      expect(mockGetDownloadLink).not.toHaveBeenCalled();
    });

    it("enregistre l'ouverture une fois le lien généré", async () => {
      mockAuthorizeTarificationDocument.mockResolvedValueOnce(pendingOpening);
      mockGetDownloadLink.mockResolvedValueOnce("https://s3.example.com/x");

      const response = await GET(linkRequest());

      expect(response.status).toBe(200);
      expect(mockRecordTarificationDocumentOpening).toHaveBeenCalledWith(
        pendingOpening
      );
      expect(mockGetDownloadLink.mock.invocationCallOrder[0]).toBeLessThan(
        mockRecordTarificationDocumentOpening.mock.invocationCallOrder[0]
      );
    });

    it("n'enregistre aucune ouverture quand le lien n'a pas pu être généré", async () => {
      mockAuthorizeTarificationDocument.mockResolvedValueOnce(pendingOpening);
      mockGetDownloadLink.mockRejectedValueOnce(new Error("S3 mal configuré"));

      await expect(GET(linkRequest())).rejects.toThrow(
        "Impossible de récupérer le lien"
      );
      expect(mockRecordTarificationDocumentOpening).not.toHaveBeenCalled();
    });

    it("ne délivre aucun lien quand l'ouverture n'a pas pu être enregistrée", async () => {
      mockAuthorizeTarificationDocument.mockResolvedValueOnce(pendingOpening);
      mockGetDownloadLink.mockResolvedValueOnce("https://s3.example.com/x");
      mockRecordTarificationDocumentOpening.mockRejectedValueOnce(
        new Error("Base indisponible")
      );

      await expect(GET(linkRequest())).rejects.toThrow(
        "Impossible de récupérer le lien"
      );
    });

    it("n'enregistre aucune ouverture pour une simple lecture des métadonnées", async () => {
      mockAuthorizeTarificationDocument.mockResolvedValueOnce(pendingOpening);

      const response = await GET(
        new NextRequest("http://localhost/api/files/test.pdf")
      );

      expect(response.status).toBe(200);
      expect(mockRecordTarificationDocumentOpening).not.toHaveBeenCalled();
    });

    it("retourne 404 sans session", async () => {
      mockGetServerSession.mockReset();
      mockGetServerSession.mockResolvedValueOnce(null);

      const response = await GET(linkRequest());

      expect(response.status).toBe(404);
      expect(mockAuthorizeTarificationDocument).not.toHaveBeenCalled();
    });
  });

  it("retourne 404 sur le lien de téléchargement à un utilisateur non autorisé pour ne pas révéler l'existence du fichier", async () => {
    // GIVEN
    mockGetFileWithParents.mockResolvedValueOnce(linkedFile);
    mockAuthorizeFileAccess.mockReturnValueOnce(false);

    const request = new NextRequest(
      "http://localhost/api/files/test.pdf?getLink=1"
    );

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(404);
    expect(mockGetDownloadLink).not.toHaveBeenCalled();
  });

  it("délivre un lien d'affichage pour un format que le navigateur sait afficher", async () => {
    mockGetFileWithParents.mockResolvedValueOnce(linkedFile);
    mockAuthorizeFileAccess.mockReturnValueOnce(true);
    mockGetInlineLink.mockResolvedValueOnce("https://s3.example.com/inline");

    const response = await GET(
      new NextRequest("http://localhost/api/files/test.pdf?getLink=1&inline=true")
    );

    expect(await response.json()).toEqual({
      url: "https://s3.example.com/inline",
    });
    expect(mockGetInlineLink).toHaveBeenCalledWith(
      process.env.S3_BUCKET_NAME,
      "test.pdf",
      "application/pdf"
    );
    expect(mockGetDownloadLink).not.toHaveBeenCalled();
  });

  it("délivre un lien de téléchargement pour un format que le navigateur n'affiche pas", async () => {
    mockGetFileWithParents.mockResolvedValueOnce({
      ...linkedFile,
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    mockAuthorizeFileAccess.mockReturnValueOnce(true);
    mockGetDownloadLink.mockResolvedValueOnce("https://s3.example.com/x");

    await GET(
      new NextRequest("http://localhost/api/files/test.pdf?getLink=1&inline=true")
    );

    expect(mockGetInlineLink).not.toHaveBeenCalled();
    expect(mockGetDownloadLink).toHaveBeenCalled();
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

  it("retourne 404 sur les métadonnées à un utilisateur non autorisé pour ne pas révéler l'existence du fichier", async () => {
    // GIVEN
    mockGetFileWithParents.mockResolvedValueOnce(linkedFile);
    mockAuthorizeFileAccess.mockReturnValueOnce(false);

    const request = new NextRequest("http://localhost/api/files/test.pdf");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(404);
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

  it("retourne 404 sur la suppression à un utilisateur non autorisé pour ne pas révéler l'existence du fichier", async () => {
    // GIVEN
    mockGetFileWithParents.mockResolvedValueOnce(linkedFile);
    mockAuthorizeFileAccess.mockReturnValueOnce(false);

    const request = new NextRequest("http://localhost/api/files/test.pdf", {
      method: "DELETE",
    });

    // WHEN
    const response = await DELETE(request);

    // THEN
    expect(response.status).toBe(404);
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
