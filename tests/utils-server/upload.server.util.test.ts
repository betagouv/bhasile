import { describe, expect, it, vi } from "vitest";

import { readUploadedFile } from "@/utils-server/upload.server.util";

const buildRequest = (
  contentLength: number,
  formData: () => Promise<FormData>
) =>
  ({
    headers: new Headers({ "content-length": String(contentLength) }),
    formData,
  }) as unknown as Request;

describe("readUploadedFile", () => {
  it("rejette un fichier trop volumineux sans lire le corps de la requête", async () => {
    const formData = vi.fn();

    await expect(
      readUploadedFile(buildRequest(42 * 1024 * 1024, formData))
    ).rejects.toMatchObject({
      status: 413,
      message: expect.stringContaining("Fichier trop volumineux"),
    });
    expect(formData).not.toHaveBeenCalled();
  });

  it("transforme un corps illisible en erreur explicite", async () => {
    const formData = vi.fn().mockRejectedValue(new TypeError("boundary"));

    await expect(
      readUploadedFile(buildRequest(1024, formData))
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining("n’a pas pu être lu"),
    });
  });
});
