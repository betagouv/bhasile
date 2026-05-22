// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/files/route";

const mockCreateOne = vi.fn();
const mockCheckBucket = vi.fn();
const mockPutObject = vi.fn();
const mockUuidV4 = vi.fn();

vi.mock("uuid", () => ({
  v4: (...args: unknown[]) => mockUuidV4(...args),
}));

vi.mock("@/lib/minio", () => ({
  checkBucket: (...args: unknown[]) => mockCheckBucket(...args),
  minioClient: {
    putObject: (...args: unknown[]) => mockPutObject(...args),
  },
}));

vi.mock("@/app/api/files/file.repository", () => ({
  createOne: (...args: unknown[]) => mockCreateOne(...args),
}));

const createFileRequest = (file: File) => {
  const formData = new FormData();
  formData.append("file", file, file.name);
  return new Request("http://localhost/api/files", {
    method: "POST",
    body: formData,
  });
};

describe("POST /api/files", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUuidV4.mockReturnValue("fixed-uuid");
  });

  it("should return 400 when file validation fails", async () => {
    // GIVEN
    const file = new File(["content"], "test.exe", { type: "application/exe" });
    const request = createFileRequest(file);

    // WHEN
    const response = await POST(request);

    // THEN
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Type de fichier non autorisé.",
    });
    expect(mockPutObject).not.toHaveBeenCalled();
  });

  it("should return upload result on success", async () => {
    // GIVEN
    mockCheckBucket.mockResolvedValueOnce(undefined);
    mockPutObject.mockResolvedValueOnce(undefined);
    mockCreateOne.mockResolvedValueOnce({ id: 42 });

    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    const request = createFileRequest(file);

    // WHEN
    const response = await POST(request);

    // THEN
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      key: "fixed-uuid-test.pdf",
      mimeType: "application/pdf",
      originalName: "test.pdf",
      id: 42,
    });
    expect(mockCheckBucket).toHaveBeenCalled();
    expect(mockPutObject).toHaveBeenCalled();
    expect(mockCreateOne).toHaveBeenCalledWith({
      key: "fixed-uuid-test.pdf",
      mimeType: "application/pdf",
      originalName: "test.pdf",
      fileSize: 7,
    });
  });
});
