import {
  buildStructureSeed,
  StructureSeedInput,
} from "../data/structure.factory";
import { prisma } from "./prisma";

export type SeededStructure = {
  id: number;
  codeBhasile: string;
  nom: string;
  type: StructureSeedInput["type"];
  operateurId: number;
};

export const createStructureForTest = async (
  overrides: Partial<StructureSeedInput> = {}
): Promise<SeededStructure> => {
  const input = buildStructureSeed(overrides);

  const structure = await prisma.structure.create({
    data: {
      codeBhasile: input.codeBhasile,
      type: input.type,
      operateurId: input.operateurId,
      nom: input.nom,
      adresseAdministrative: input.adresseAdministrative,
      codePostalAdministratif: input.codePostalAdministratif,
      communeAdministrative: input.communeAdministrative,
      departementAdministratif: input.departementAdministratif,
      creationDate: new Date(`${input.creationDate}T12:00:00.000Z`),
      lgbt: input.lgbt,
      fvvTeh: input.fvvTeh,
      public: input.public,
      dnaStructures: {
        create: input.dnaCodes.map(({ code }) => ({
          dna: {
            connectOrCreate: {
              where: { code },
              create: { code },
            },
          },
        })),
      },
      structureFinesses: {
        create: [
          {
            finess: {
              connectOrCreate: {
                where: { code: input.finessCode },
                create: { code: input.finessCode },
              },
            },
          },
        ],
      },
    },
  });

  return {
    id: structure.id,
    codeBhasile: structure.codeBhasile,
    nom: structure.nom ?? input.nom,
    type: input.type,
    operateurId: input.operateurId,
  };
};
