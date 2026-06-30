import { normalizeAccents } from "@/app/utils/string.util";
import { Operateur } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { OperateurApiWrite } from "@/schemas/api/operateur.schema";

import { createOrUpdateActesAdministratifs } from "../actes-administratifs/acte-administratif.repository";
import { createOrUpdateContacts } from "../contacts/contact.repository";
import {
  OperateurDbDetail,
  OperateurListRow,
  operateurListSelect,
} from "./operateur.db.type";

export const findBySearchTerm = async (
  searchTerm: string | null
): Promise<Operateur[]> => {
  if (!searchTerm) {
    return [];
  }

  const operateurs = await prisma.operateur.findMany({});
  return operateurs.filter((operateur) =>
    normalizeAccents(operateur.name).includes(normalizeAccents(searchTerm))
  );
};

export const findAllOperateurs = (): Promise<OperateurListRow[]> =>
  prisma.operateur.findMany({ select: operateurListSelect });

export const findOne = async (id: number): Promise<OperateurDbDetail> => {
  return prisma.operateur.findFirstOrThrow({
    where: { id },
    include: {
      contacts: true,
      actesAdministratifs: {
        include: { fileUploads: true },
      },
      logo: true,
    },
  });
};

export const updateOne = async (
  operateur: OperateurApiWrite
): Promise<Operateur> => {
  const { actesAdministratifs, contacts, logo, ...operateurFields } = operateur;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.operateur.update({
      where: { id: operateur.id },
      data: {
        ...operateurFields,
        ...(logo && { logo: { connect: { key: logo.key } } }),
      },
    });

    await createOrUpdateActesAdministratifs(tx, actesAdministratifs, {
      operateurId: operateur.id,
    });

    await createOrUpdateContacts(tx, contacts, {
      operateurId: operateur.id,
    });

    return updated;
  });
};
