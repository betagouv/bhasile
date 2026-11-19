import type {
  TarificationDocumentStatus,
  TarificationDocumentType,
} from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import type { PrismaTransaction } from "@/types/prisma.type";

// La première ouverture fait foi : les suivantes n'écrasent rien
export const createTarificationDocumentOpening = (
  documentId: number,
  userId: number
) =>
  prisma.tarificationDocumentOpening.createMany({
    data: [{ documentId, userId }],
    skipDuplicates: true,
  });

export const createTarificationDocument = (
  tx: PrismaTransaction,
  structureTarificationId: number,
  document: TarificationDocumentCreate
): Promise<{ id: number }> =>
  tx.tarificationDocument.create({
    data: { structureTarificationId, ...document },
    select: { id: true },
  });

export type TarificationDocumentCreate = {
  fileUploadId: number;
  types: TarificationDocumentType[];
  status: TarificationDocumentStatus;
};
