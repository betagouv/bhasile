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
