import { DomainError } from "@/app/utils/domain-error.util";
import { ALLOWED_MIME_TYPES } from "@/constants";
import { FILE_TOO_LARGE_MESSAGE, isFileTooLarge } from "@/utils/upload.util";

export const readUploadedFile = async (
  request: Request,
  allowedMimeTypes: string[] = ALLOWED_MIME_TYPES
): Promise<UploadedFile> => {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (isFileTooLarge(contentLength)) {
    throw new DomainError(FILE_TOO_LARGE_MESSAGE, 413);
  }

  const file = await readFormDataFile(request);
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
  };
};

const readFormDataFile = async (
  request: Request
): Promise<FormDataEntryValue | null> => {
  try {
    return (await request.formData()).get("file");
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
};
