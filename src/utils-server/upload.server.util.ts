import { DomainError } from "@/app/utils/domain-error.util";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/constants";

export const readUploadedFile = async (
  request: Request,
  allowedMimeTypes: string[] = ALLOWED_MIME_TYPES
): Promise<UploadedFile> => {
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) {
    throw new DomainError("Aucun fichier fourni");
  }
  if (!allowedMimeTypes.includes(file.type)) {
    throw new DomainError("Type de fichier non autorisé.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new DomainError("Fichier trop volumineux.");
  }
  return {
    buffer: Buffer.from(await file.arrayBuffer()),
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  };
};

export type UploadedFile = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  size: number;
};
