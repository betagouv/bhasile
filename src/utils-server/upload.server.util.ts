import { DomainError } from "@/app/utils/domain-error.util";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/constants";
import { FILE_TOO_LARGE_MESSAGE, isFileTooLarge } from "@/utils/upload.util";

const MULTIPART_OVERHEAD_MARGIN = 1024 * 1024;

export const readUploadedFile = async (
  request: Request,
  allowedMimeTypes: string[] = ALLOWED_MIME_TYPES
): Promise<UploadedFile> => {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_FILE_SIZE + MULTIPART_OVERHEAD_MARGIN) {
    throw new DomainError(FILE_TOO_LARGE_MESSAGE, 413);
  }

  const formData = await readFormData(request);
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new DomainError("Aucun fichier fourni");
  }
  if (!allowedMimeTypes.includes(file.type)) {
    throw new DomainError("Type de fichier non autorisé.");
  }
  if (isFileTooLarge(file.size)) {
    throw new DomainError(FILE_TOO_LARGE_MESSAGE, 413);
  }
  return {
    buffer: Buffer.from(await file.arrayBuffer()),
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    fields: Object.fromEntries(
      [...formData.entries()].filter(
        (entry): entry is [string, string] => typeof entry[1] === "string"
      )
    ),
  };
};

const readFormData = async (request: Request): Promise<FormData> => {
  try {
    return await request.formData();
  } catch {
    throw new DomainError(
      "Le fichier n’a pas pu être lu : il est peut-être corrompu ou trop volumineux"
    );
  }
};

export type UploadedFile = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  size: number;
  fields: Record<string, string>;
};
