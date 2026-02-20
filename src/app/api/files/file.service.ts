import { v4 as uuidv4 } from "uuid";

import {
  ALLOWED_MIME_TYPES,
  FILE_UPLOAD_EXPIRATION_DELAY,
  MAX_FILE_SIZE,
} from "@/constants";
import { checkBucket, minioClient } from "@/lib/minio";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";
import { deleteOneByKey } from "./file.repository";

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

export const deleteFileAndRecord = async (
  bucketName: string,
  key: string
): Promise<Awaited<ReturnType<typeof deleteOneByKey>>> => {
  await deleteFile(bucketName, key);
  return deleteOneByKey(key);
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

export const listFiles = async (bucketName: string): Promise<void> => {
  try {
    const files = await new Promise((resolve, reject) => {
      const fetchedFiles: unknown[] = [];
      const stream = minioClient.listObjectsV2(bucketName, "", true, "");
      stream.on("data", (obj) => fetchedFiles.push(obj.name));
      stream.on("error", reject);
      stream.on("end", () => {
        resolve(fetchedFiles);
      });
    });
    console.log(`Fichiers du bucket ${bucketName}`, files);
  } catch (error) {
    console.error(error);
    throw new Error("Impossible de récupérer les objets");
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
