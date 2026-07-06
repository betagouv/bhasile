import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  FileUploadResponse,
  FileUploadWithLink,
  useFileUpload,
} from "@/app/hooks/useFileUpload";

const mockFetch = vi.fn();
global.fetch = mockFetch;

class MockFormData implements FormData {
  append = vi.fn();
  delete = vi.fn();
  get = vi.fn();
  getAll = vi.fn();
  has = vi.fn();
  set = vi.fn();
  forEach = vi.fn();
  entries = vi.fn(() => [][Symbol.iterator]());
  keys = vi.fn(() => [][Symbol.iterator]());
  values = vi.fn(() => [][Symbol.iterator]());
  [Symbol.iterator] = vi.fn(() => [][Symbol.iterator]());
}

const mockFormDataInstance = new MockFormData();

global.FormData = vi.fn(function () {
  return mockFormDataInstance;
}) as unknown as typeof FormData;

describe("useFileUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFormDataInstance.append.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("uploadFile", () => {
    it("téléverse un fichier avec succès", async () => {
      // GIVEN
      const mockFile = new File(["test content"], "test.txt", {
        type: "text/plain",
      });

      const mockUploadResponse: FileUploadResponse = {
        key: "file-123",
        mimeType: "text/plain",
        originalName: "test.txt",
        id: 1,
        fileSize: 12,
      };

      const mockDownloadUrl = "https://example.com/files/file-123";

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUploadResponse),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ url: mockDownloadUrl }),
        });

      // WHEN
      const { result } = renderHook(() => useFileUpload());

      let uploadResult: FileUploadWithLink | undefined;
      await act(async () => {
        uploadResult = await result.current.uploadFile(mockFile);
      });

      // THEN
      // Verify FormData append calls
      expect(mockFormDataInstance.append).toHaveBeenCalledWith(
        "file",
        mockFile
      );

      // Verify fetch calls
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(1, "/api/files", {
        method: "POST",
        body: mockFormDataInstance,
      });
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        "/api/files/file-123?getLink=true"
      );
      expect(uploadResult).toEqual({
        ...mockUploadResponse,
        fileUrl: mockDownloadUrl,
      });
    });

    it("lève une erreur quand le téléversement échoue", async () => {
      // GIVEN
      const mockFile = new File(["test content"], "test.txt", {
        type: "text/plain",
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Envoi du fichier échoué" }),
      });

      // WHEN
      const { result } = renderHook(() => useFileUpload());

      // THEN
      await expect(result.current.uploadFile(mockFile)).rejects.toThrow(
        "Envoi du fichier échoué"
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("getFile", () => {
    it("récupère un fichier avec succès", async () => {
      // GIVEN
      const fileKey = "file-123";

      const mockFileResponse: FileUploadResponse = {
        key: fileKey,
        mimeType: "text/plain",
        originalName: "test.txt",
        id: 1,
        fileSize: 12,
      };

      const mockDownloadUrl = "https://example.com/files/file-123";

      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockFileResponse),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ url: mockDownloadUrl }),
        });

      // WHEN
      const { result } = renderHook(() => useFileUpload());

      let fileResult: FileUploadWithLink | undefined;
      await act(async () => {
        fileResult = await result.current.getFile(fileKey);
      });

      // THEN
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        `/api/files/${encodeURIComponent(fileKey)}`
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        `/api/files/${encodeURIComponent(fileKey)}?getLink=true`
      );
      expect(fileResult).toEqual({
        ...mockFileResponse,
        fileUrl: mockDownloadUrl,
      });
    });
  });

  describe("getDownloadLink", () => {
    it("récupère un lien de téléchargement avec succès", async () => {
      // GIVEN
      const fileName = "file-123";
      const mockDownloadUrl = "https://example.com/files/file-123";

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ url: mockDownloadUrl }),
      });

      // WHEN
      const { result } = renderHook(() => useFileUpload());

      let downloadUrl: string | undefined;
      await act(async () => {
        downloadUrl = await result.current.getDownloadLink(fileName);
      });

      // THEN
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/files/${encodeURIComponent(fileName)}?getLink=true`
      );
      expect(downloadUrl).toEqual(mockDownloadUrl);
    });
  });

  describe("deleteFile", () => {
    it("supprime un fichier avec succès", async () => {
      // GIVEN
      const fileKey = "file-123";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // WHEN
      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        await result.current.deleteFile(fileKey);
      });

      // THEN
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/files/${encodeURIComponent(fileKey)}`,
        {
          method: "DELETE",
        }
      );
    });

    it("lève une erreur quand la suppression échoue", async () => {
      // GIVEN
      const fileKey = "file-123";

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Erreur lors de la suppression" }),
      });

      // WHEN
      const { result } = renderHook(() => useFileUpload());

      // THEN
      await expect(result.current.deleteFile(fileKey)).rejects.toThrow(
        "Erreur lors de la suppression"
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
