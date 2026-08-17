import { StructureType } from "@/types/structure.type";

import { prisma } from "../../e2e/seed/prisma";
import { parseAddress } from "./shared-utils";
import { TestStructureData } from "./test-data/types";

/**
 * Seeds the structure with the minimum data required for the selection list.
 *
 * The selection list (and every version-anchored read) joins on the current
 * StructureVersion, so a structure without a version is invisible to it. We
 * therefore create a minimal current version carrying the fields the list
 * filters on (type, departementAdministratif, operateur via the structure).
 */
export async function seedStructureForSelection(
  testData: Partial<TestStructureData> & { codeBhasile: string }
): Promise<number> {
  const adminAddress = testData.adresseAdministrative
    ? parseAddress(testData.adresseAdministrative.searchTerm)
    : { street: "", postalCode: "", city: "", department: "" };

  const type = testData.type ?? StructureType.CADA;

  const { id } = await createMinimalStructure({
    codeBhasile: testData.codeBhasile,
    type,
    operateurId: testData.operateur?.id ?? 1,
    departementAdministratif: testData.departementAdministratif ?? "01",
  });

  await createMinimalStructureVersion(id, {
    operateurId: testData.operateur?.id ?? 1,
    departementAdministratif: testData.departementAdministratif ?? "01",
    communeAdministrative: adminAddress.city,
    codePostalAdministratif: adminAddress.postalCode,
    adresseAdministrative: testData.adresseAdministrative?.complete ?? "",
    nom: testData.nom ?? "",
    effectiveDate: testData.creationDate
      ? new Date(testData.creationDate)
      : undefined,
    dnaCodes: testData.dnas ?? [],
  });

  return id;
}

const createMinimalStructure = async (structure: {
  codeBhasile: string;
  type: StructureType;
  operateurId: number;
  departementAdministratif: string;
}): Promise<{ id: number }> => {
  // Les scalaires versionnés et les liens DNA sont portés par StructureVersion :
  // voir createMinimalStructureVersion.
  return await prisma.structure.upsert({
    where: { codeBhasile: structure.codeBhasile },
    update: structure,
    create: structure,
    select: { id: true },
  });
};

const createMinimalStructureVersion = async (
  structureId: number,
  version: {
    operateurId: number;
    departementAdministratif: string;
    communeAdministrative?: string;
    codePostalAdministratif?: string;
    adresseAdministrative?: string;
    nom?: string;
    effectiveDate?: Date;
    dnaCodes?: { code: string }[];
  }
): Promise<void> => {
  await prisma.structureVersion.deleteMany({
    where: { structureId, structureVersionTransformationId: null },
  });

  await prisma.structureVersion.create({
    data: {
      structureId,
      effectiveDate: version.effectiveDate ?? new Date("2020-01-01"),
      departementAdministratif: version.departementAdministratif,
      communeAdministrative: version.communeAdministrative,
      codePostalAdministratif: version.codePostalAdministratif,
      adresseAdministrative: version.adresseAdministrative,
      nom: version.nom,
      dnaStructures: {
        create: (version.dnaCodes ?? []).map(({ code }) => ({
          dna: {
            connectOrCreate: {
              where: { code },
              create: {
                code,
                type: StructureType.CADA,
                nom: `DNA ${code}`,
                nomOfii: `DNA ${code}`,
                directionTerritoriale: "DT",
                operateur: { connect: { id: version.operateurId } },
                departement: {
                  connect: { numero: version.departementAdministratif },
                },
              },
            },
          },
        })),
      },
    },
  });
};
