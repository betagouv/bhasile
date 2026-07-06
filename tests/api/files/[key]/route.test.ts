import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, GET } from "@/app/api/files/[key]/route";

const mockFindOneByKey = vi.fn();
const mockDeleteOneByKey = vi.fn();
const mockPresignedGetObject = vi.fn();
const mockRemoveObject = vi.fn();

vi.mock("@/app/api/files/file.repository", () => ({
  findOneByKey: (...args: unknown[]) => mockFindOneByKey(...args),
  deleteOneByKey: (...args: unknown[]) => mockDeleteOneByKey(...args),
}));

vi.mock("@/lib/minio", () => ({
  checkBucket: vi.fn(),
  minioClient: {
    presignedGetObject: (...args: unknown[]) => mockPresignedGetObject(...args),
    removeObject: (...args: unknown[]) => mockRemoveObject(...args),
  },
}));

describe("GET /api/files/[key]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne le lien de téléchargement quand le param getLink est présent", async () => {
    // GIVEN
    mockPresignedGetObject.mockResolvedValueOnce(
      "https://s3.example.com/test.pdf"
    );

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
    expect(mockPresignedGetObject).toHaveBeenCalled();
    expect(mockFindOneByKey).not.toHaveBeenCalled();
    expect(mockDeleteOneByKey).not.toHaveBeenCalled();
  });

  it("retourne 404 quand le fichier est introuvable", async () => {
    // GIVEN
    mockFindOneByKey.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost/api/files/unknown.pdf");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Aucun fichier trouvé" });
    expect(mockPresignedGetObject).not.toHaveBeenCalled();
    expect(mockDeleteOneByKey).not.toHaveBeenCalled();
  });

  it("retourne les métadonnées du fichier quand il est trouvé", async () => {
    // GIVEN
    const file = { id: 1, key: "test.pdf", mimeType: "application/pdf" };
    mockFindOneByKey.mockResolvedValueOnce(file);

    const request = new NextRequest("http://localhost/api/files/test.pdf");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(file);
    expect(mockFindOneByKey).toHaveBeenCalledWith("test.pdf");
  });
});

describe("DELETE /api/files/[key]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 404 quand le fichier est introuvable", async () => {
    // GIVEN
    mockFindOneByKey.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost/api/files/unknown.pdf", {
      method: "DELETE",
    });

    // WHEN
    const response = await DELETE(request);

    // THEN
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Aucun fichier trouvé" });
    expect(mockRemoveObject).not.toHaveBeenCalled();
    expect(mockDeleteOneByKey).not.toHaveBeenCalled();
  });

  it("retourne le fichier supprimé en cas de succès", async () => {
    // GIVEN
    const file = { id: 1, key: "test.pdf" };
    mockFindOneByKey.mockResolvedValueOnce(file);
    mockRemoveObject.mockResolvedValueOnce(undefined);
    mockDeleteOneByKey.mockResolvedValueOnce(file);

    const request = new NextRequest("http://localhost/api/files/test.pdf", {
      method: "DELETE",
    });

    // WHEN
    const response = await DELETE(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(file);
    expect(mockRemoveObject).toHaveBeenCalled();
    expect(mockDeleteOneByKey).toHaveBeenCalledWith("test.pdf");
  });

  it("retourne 500 quand la suppression échoue", async () => {
    // GIVEN
    const file = { id: 1, key: "test.pdf" };
    mockFindOneByKey.mockResolvedValueOnce(file);
    mockRemoveObject.mockRejectedValueOnce(new Error("S3 error"));

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
    expect(mockDeleteOneByKey).not.toHaveBeenCalled();
  });
});
