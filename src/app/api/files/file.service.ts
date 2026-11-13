import { createHash } from "node:crypto";

import { Session } from "next-auth";
import { v4 as uuidv4 } from "uuid";

import { DomainError } from "@/app/utils/domain-error.util";
import {
  ALLOWED_MIME_TYPES,
  FILE_UPLOAD_EXPIRATION_DELAY,
  MAX_FILE_SIZE,
} from "@/constants";
import { FileUpload } from "@/generated/prisma/client";
import { canDeleteFile, canReadConversation } from "@/lib/casl";
import { checkBucket, getMinioClient } from "@/lib/minio";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";
import { EntityId } from "@/types/Entity.type";
import { SessionUser } from "@/types/global";
import { Principal, PrincipalType } from "@/types/principal.type";
import { PrismaTransaction } from "@/types/prisma.type";

import { FileWithParents } from "./file.db.type";
import {
  createOne,
  deleteOneByKey,
  findManyByKeysWithParents,
  findOneByKeyWithParents,
} from "./file.repository";

export const getPrincipal = (session: Session | null): Principal =>
  session?.user
    ? { type: PrincipalType.Agent, user: session.user as SessionUser }
    : { type: PrincipalType.Operateur };

type FileParent = Partial<Record<keyof EntityId, number | null>>;

const getFileParents = (file: FileWithParents): FileParent[] => {
  const parents: [number | null, FileParent | null][] = [
    [file.acteAdministratifId, file.acteAdministratif],
    [file.documentFinancierId, file.documentFinancier],
    [file.controleId, file.controle],
    [file.evaluationId, file.evaluation],
    [file.operateurId, { operateurId: file.operateurId }],
    [file.messageId, {}],
    [file.tarificationDocument?.id ?? null, {}],
  ];
  return parents.flatMap(([parentId, parent]) =>
    parentId == null ? [] : [parent ?? {}]
  );
};

const isOrphan = (file: FileWithParents): boolean =>
  getFileParents(file).length === 0;

const isParentOfEntity = (parent: FileParent, entityId: EntityId): boolean => {
  const entityFields = (Object.keys(entityId) as (keyof EntityId)[]).filter(
    (field) => entityId[field] !== undefined
  );
  return (
    entityFields.length > 0 &&
    entityFields.every((field) => parent[field] === entityId[field])
  );
};

export const assertFilesCanBeAttachedToEntity = async (
  tx: PrismaTransaction,
  fileUploads: { key: string }[],
  entityId: EntityId
): Promise<void> => {
  if (fileUploads.length === 0) {
    return;
  }

  const files = await findManyByKeysWithParents(
    tx,
    fileUploads.map((fileUpload) => fileUpload.key)
  );

  const foundKeys = new Set(files.map((file) => file.key));
  if (fileUploads.some((fileUpload) => !foundKeys.has(fileUpload.key))) {
    throw new DomainError("Fichier introuvable", 404);
  }

  const hasFileFromOtherEntity = files.some((file) =>
    getFileParents(file).some((parent) => !isParentOfEntity(parent, entityId))
  );
  if (hasFileFromOtherEntity) {
    throw new DomainError(
      "Un fichier est déjà rattaché à une autre entité",
      409
    );
  }
};

export const authorizeFileAccess = (
  principal: Principal,
  file: FileWithParents,
  action: "read" | "delete"
): boolean => {
  if (isOrphan(file)) {
    return true;
  }

  if (file.tarificationDocument) {
    return false;
  }
  if (principal.type === PrincipalType.Operateur) {
    return false;
  }
  if (file.message) {
    return (
      action === "read" &&
      canReadConversation(principal.user, file.message.conversation)
    );
  }
  if (action === "read") {
    return true;
  }
  return canDeleteFile(principal.user, file);
};

export const getSha256 = (fileBuffer: Buffer): string =>
  createHash("sha256").update(fileBuffer).digest("hex");

export const uploadFile = async (
  bucketName: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string
) => {
  try {
    await checkBucket(bucketName);
    const key = `${uuidv4()}-${fileName}`;
    await getMinioClient().putObject(bucketName, key, fileBuffer);
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
    await getMinioClient().removeObject(bucketName, fileName);
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
    return getMinioClient().presignedGetObject(
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
    DocumentFinancierApiType[] | ActeAdministratifApiType[]
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
  sha256,
}: {
  key: string;
  mimeType: string;
  originalName: string;
  fileSize: number;
  sha256: string;
}): Promise<FileUpload | null> => {
  return createOne({ key, mimeType, originalName, fileSize, sha256 });
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
