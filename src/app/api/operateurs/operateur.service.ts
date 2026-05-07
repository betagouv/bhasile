import { Operateur } from "@/generated/prisma/client";
import {
  OperateurApiRead,
  OperateurApiWrite,
} from "@/schemas/api/operateur.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import { DocumentFinancierCategory } from "@/types/document-financier.type";

import {
  countOperateurs,
  findBySearchTerm,
  findOne,
  getPaginatedOperateurs,
  updateOne,
} from "./operateur.repository";

export const getOperateurs = async ({
  page,
  search,
}: {
  page: number | null;
  search: string | null;
}): Promise<{ operateurs: Partial<Operateur>[]; totalOperateurs: number }> => {
  const dbOperateurs = await getPaginatedOperateurs({ page, search });

  const operateurs = dbOperateurs.map((row) => ({
    id: row.id,
    name: row.name,
    nbStructures: Number(row.nb_structures),
    totalPlaces: Number(row.total_places),
    pourcentageParc: Number(row.pourcentage_parc),
    structureTypes: String(row.structure_types)
      .replaceAll("{", "")
      .replaceAll("}", "")
      .split(","),
  }));

  const totalOperateurs = await countOperateurs({ search });

  return {
    operateurs,
    totalOperateurs,
  };
};

export const getOperateur = async (id: number): Promise<OperateurApiRead> => {
  const operateur = await findOne(id);
  const vulnerabilites: string[] = [];
  operateur.structures.forEach((structure) => {
    if (structure.lgbt && !vulnerabilites.includes("LGBT")) {
      vulnerabilites.push("LGBT");
    }
    if (structure.fvvTeh && !vulnerabilites.includes("FVV-TEH")) {
      vulnerabilites.push("FVV-TEH");
    }
  });

  return {
    ...operateur,
    vulnerabilites,
    actesAdministratifs: operateur.actesAdministratifs?.map(
      (acteAdministratif) => ({
        ...acteAdministratif,
        category: acteAdministratif.category as ActeAdministratifCategory,
        parentId: acteAdministratif.parentId!,
        cpomId: acteAdministratif.cpomId!,
        date: new Date(acteAdministratif.date!).toISOString(),
        startDate: new Date(acteAdministratif.date!).toISOString(),
        endDate: new Date(acteAdministratif.date!).toISOString(),
        fileUploads: acteAdministratif.fileUploads.map((fileUpload) => ({
          ...fileUpload,
          acteAdministratifId: fileUpload.acteAdministratifId!,
          documentFinancierId: fileUpload.documentFinancierId!,
          controleId: fileUpload.controleId!,
          evaluationId: fileUpload.evaluationId!,
        })),
      })
    ),
    documentsFinanciers: operateur.documentsFinanciers?.map(
      (documentFinancier) => ({
        ...documentFinancier,
        category: documentFinancier.category as DocumentFinancierCategory,
        structureId: documentFinancier.structureId!,
        fileUploads: documentFinancier.fileUploads.map((fileUpload) => ({
          ...fileUpload,
          acteAdministratifId: fileUpload.acteAdministratifId!,
          documentFinancierId: fileUpload.documentFinancierId!,
          controleId: fileUpload.controleId!,
          evaluationId: fileUpload.evaluationId!,
        })),
      })
    ),
  };
};

export const updateOperateur = async (
  operateur: OperateurApiWrite
): Promise<Operateur> => {
  return updateOne(operateur);
};

export const getOperateursSuggestions = async (
  search: string | null
): Promise<Operateur[]> => {
  return findBySearchTerm(search);
};
