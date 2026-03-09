import { ControleApiType } from "@/schemas/api/controle.schema";
import { PrismaTransaction } from "@/types/prisma.type";

import { convertToControleType } from "./controle.util";

const deleteControles = async (
  tx: PrismaTransaction,
  controlesToKeep: ControleApiType[],
  structureDnaCode: string
): Promise<void> => {
  const allControles = await tx.controle.findMany({
    where: { structureDnaCode: structureDnaCode },
  });
  const controlesToDelete = allControles.filter(
    (controle) =>
      !controlesToKeep.some(
        (controleToKeep) => controleToKeep.id === controle.id
      )
  );
  await Promise.all(
    controlesToDelete.map((controle) =>
      tx.controle.delete({ where: { id: controle.id } })
    )
  );
};

export const createOrUpdateControles = async (
  tx: PrismaTransaction,
  controles: ControleApiType[] | undefined,
  structureDnaCode: string
): Promise<void> => {
  if (!controles || controles.length === 0) {
    return;
  }

  await deleteControles(tx, controles, structureDnaCode);

  await Promise.all(
    (controles || []).map((controle) => {
      return tx.controle.upsert({
        where: { id: controle.id || 0 },
        update: {
          type: convertToControleType(controle.type),
          date: controle.date,
          fileUploads: {
            connect: (controle.fileUploads ?? []).map((fileUpload) => ({
              key: fileUpload.key,
            })),
          },
        },
        create: {
          structureDnaCode,
          type: convertToControleType(controle.type),
          date: controle.date!,
          fileUploads: {
            connect: (controle.fileUploads ?? []).map((fileUpload) => ({
              key: fileUpload.key,
            })),
          },
        },
      });
    })
  );
};
