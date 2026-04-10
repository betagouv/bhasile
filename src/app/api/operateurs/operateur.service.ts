import { Operateur } from "@/generated/prisma/client";

import { getPaginatedOperateurs } from "./operateur.repository";

export const getOperateurs = async ({
  page,
}: {
  page: number | null;
}): Promise<Partial<Operateur>[]> => {
  const operateurs = await getPaginatedOperateurs({ page });

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
