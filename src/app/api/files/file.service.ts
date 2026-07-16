import { Session } from "next-auth";
import { v4 as uuidv4 } from "uuid";

import {
  ALLOWED_MIME_TYPES,
  FILE_UPLOAD_EXPIRATION_DELAY,
  MAX_FILE_SIZE,
} from "@/constants";
import { FileUpload } from "@/generated/prisma/client";
import { canDeleteFile } from "@/lib/casl/abilities";
import { checkBucket, minioClient } from "@/lib/minio";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";
import { SessionUser } from "@/types/global";
import { Principal, PrincipalType } from "@/types/principal.type";

import { FileWithParents } from "./file.db.type";
import {
  createOne,
  deleteOneByKey,
  findOneByKeyWithParents,
} from "./file.repository";

export const getPrincipal = (session: Session | null): Principal =>
  session?.user
    ? { type: PrincipalType.Agent, user: session.user as SessionUser }
    : { type: PrincipalType.Operateur };

const isOrphan = (file: FileWithParents): boolean =>
  file.acteAdministratifId == null &&
  file.documentFinancierId == null &&
  file.controleId == null &&
  file.evaluationId == null &&
  file.operateurId == null;

export const authorizeFileAccess = (
  principal: Principal,
  file: FileWithParents,
  action: "read" | "delete"
): boolean => {
  if (isOrphan(file)) {
    return true;
  }
  if (principal.type === PrincipalType.Operateur) {
    return false;
  }
  if (action === "read") {
    return true;
  }
  return canDeleteFile(principal.user, file);
};

export const uploadFile = async (
  bucketName: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string
) => {
  try {
    await checkBucket(bucketName);
    const key = `${uuidv4()}-${fileName}`;
    await minioClient.putObject(bucketName, key, fileBuffer);
    return {
      key,
      mimeType,
      originalName: fileName,
    };
  } catch (error) {
    console.error(error);
    throw new Error("Erreur lors de l'upload du fichier");
  }
};

export const deleteFile = async (
  bucketName: string,
  fileName: string
): Promise<void> => {
  try {
    await minioClient.removeObject(bucketName, fileName);
  } catch (error) {
    console.error(error);
    throw new Error("Erreur lors de la suppression du fichier");
  }
};

export const getDownloadLink = async (
  bucketName: string,
  fileName: string
): Promise<string> => {
  try {
    return minioClient.presignedGetObject(
      bucketName,
      fileName,
      FILE_UPLOAD_EXPIRATION_DELAY
    );
  } catch (error) {
    console.error(error);
    throw new Error("Erreur lors du téléchargement du fichier");
  }
};

export const validateUpload = (
  mimeType: string,
  fileSize: number
): string | null => {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return "Type de fichier non autorisé.";
  }
  if (fileSize > MAX_FILE_SIZE) {
    return "Fichier trop volumineux.";
  }
  return null;
};

export const getKeysFromIncomingDocumentsOrActes = (
  documentsFinanciersOrActes:
    | DocumentFinancierApiType[]
    | ActeAdministratifApiType[]
): Set<string> => {
  const keys = new Set<string>();
  for (const doc of documentsFinanciersOrActes) {
    const key = doc.fileUploads?.[0]?.key;
    if (key) {
      keys.add(key);
    }
  }
  return keys;
};

export const createUploadedFile = async ({
  key,
  mimeType,
  originalName,
  fileSize,
}: {
  key: string;
  mimeType: string;
  originalName: string;
  fileSize: number;
}): Promise<FileUpload | null> => {
  return createOne({ key, mimeType, originalName, fileSize });
};

export const getFileWithParents = async (
  key: string
): Promise<FileWithParents | null> => {
  return findOneByKeyWithParents(key);
};

export const deleteFileByStorageKey = async (
  key: string
): Promise<FileUpload | null> => {
  return deleteOneByKey(key);
};
