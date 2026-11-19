import { uploadFile } from "@/app/api/files/file.service";
import { ImportFile } from "@/types/import.type";

const ARCHIVE_FOLDER = "superadmin";

export const archiveImportFile = async (
  { buffer, fileName }: ImportFile,
  folder: string
): Promise<void> => {
  const bucketName = process.env.DOCS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("DOCS_BUCKET_NAME doit être défini pour archiver l’import");
  }
  await uploadFile(
    bucketName,
    fileName,
    buffer,
    "application/octet-stream",
    `${ARCHIVE_FOLDER}/${folder}`
  );
};
