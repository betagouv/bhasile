import { normalizeAccents } from "@/app/utils/string.util";
import { Operateur, StructureType } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { OperateurApiWrite } from "@/schemas/api/operateur.schema";

import { createOrUpdateActesAdministratifs } from "../actes-administratifs/acte-administratif.repository";
import { createOrUpdateContacts } from "../contacts/contact.repository";
import { OperateurDbDetail } from "./operateur.db.type";
import { buildPaginatedOperateursQuery } from "./operateur.sql";

export const findBySearchTerm = async (
  searchTerm: string | null
): Promise<Operateur[]> => {
  const operateurs = await prisma.operateur.findMany({});
  if (!searchTerm) {
    return operateurs;
  }
  return operateurs.filter((operateur) =>
    normalizeAccents(operateur.name).includes(normalizeAccents(searchTerm))
  );
};

export const getPaginatedOperateurs = async (
  {
    page,
    search,
  }: {
    page: number | null;
    search: string | null;
  },
  now: Date
): Promise<OperateurStat[]> => {
  return prisma.$queryRaw<OperateurStat[]>(
    buildPaginatedOperateursQuery({ page, search }, now)
  );
};

export const countOperateurs = async ({
  search,
}: {
  search: string | null;
}): Promise<number> => {
  return prisma.operateur.count({
    where: {
      parentId: null,
      structures: {
        some: {},
      },
      ...(search
        ? {
            name: {
              contains: search,
              mode: "insensitive",
            },
          }
        : undefined),
    },
  });
};

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

type OperateurStat = {
  id: number;
  name: string;
  nb_structures: number;
  total_places: number;
  pourcentage_parc: number;
  structure_types: StructureType[];
  logo_key: string;
};
