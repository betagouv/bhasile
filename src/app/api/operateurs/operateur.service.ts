import { Operateur } from "@/generated/prisma/client";
import { OperateurApiRead } from "@/schemas/api/operateur.schema";

import { findOne, getPaginatedOperateurs } from "./operateur.repository";

export const getOperateurs = async ({
  page,
  search,
}: {
  page: number | null;
  search: string | null;
}): Promise<Partial<Operateur>[]> => {
  const operateurs = await getPaginatedOperateurs({ page, search });

  return operateurs.map((row) => ({
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
    documents: operateur.documents.map((document) => ({
      ...document,
      date: document.date ? new Date(document.date).toISOString() : undefined,
      fileUploads: document.fileUploads?.map((file) => ({
        ...file,
        acteAdministratifId: file.acteAdministratifId ?? undefined,
        documentFinancierId: file.documentFinancierId ?? undefined,
        controleId: file.controleId ?? undefined,
        evaluationId: file.evaluationId ?? undefined,
        documentOperateurId: file.documentOperateurId ?? undefined,
      })),
    })),
  };
};
