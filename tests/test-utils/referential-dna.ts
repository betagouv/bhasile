import { randomUUID } from "node:crypto";

import prisma from "@/lib/prisma";
import { StructureType } from "@/types/structure.type";

// Champs texte requis d'un DNA (en plus des FK opérateur/département).
const referentialDnaScalars = () => ({
  type: StructureType.CADA,
  nom: "DNA référentiel test",
  nomOfii: "DNA OFII test",
  directionTerritoriale: "DT test",
});

type DnaCreateData = NonNullable<
  Parameters<typeof prisma.dna.create>[0]
>["data"];

// Crée un DNA complet pour les tests DB, `extra` permet d'ajouter des relations imbriquées (ex : activites).
export const createReferentialDna = async (
  code: string,
  extra: Partial<DnaCreateData> = {}
) => {
  const departement = await prisma.departement.findFirstOrThrow();
  const operateur = await prisma.operateur.create({
    data: { name: `DNA-OP-${randomUUID()}` },
  });

  return prisma.dna.create({
    data: {
      code,
      ...referentialDnaScalars(),
      operateur: { connect: { id: operateur.id } },
      departement: { connect: { numero: departement.numero } },
      ...extra,
    } as DnaCreateData,
  });
};
