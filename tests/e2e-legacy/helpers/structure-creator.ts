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

  const { id } = await createMinimalStructure(testData.dnas ?? [], {
    codeBhasile: testData.codeBhasile,
    type,
    operateurId: testData.operateur?.id ?? 1,
    departementAdministratif: testData.departementAdministratif,
    nom: testData.nom ?? "",
    adresseAdministrative: testData.adresseAdministrative?.complete ?? "",
    codePostalAdministratif: adminAddress.postalCode,
    communeAdministrative: adminAddress.city,
  });

  await createMinimalStructureVersion(id, {
    departementAdministratif: testData.departementAdministratif,
    communeAdministrative: adminAddress.city,
    codePostalAdministratif: adminAddress.postalCode,
    adresseAdministrative: testData.adresseAdministrative?.complete ?? "",
    nom: testData.nom ?? "",
    effectiveDate: testData.creationDate
      ? new Date(testData.creationDate)
      : undefined,
  });

  return id;
}

const createMinimalStructure = async (
  dnaCodes: { code: string }[],
  structure: {
    codeBhasile: string;
    type: StructureType;
    operateurId: number;
    departementAdministratif?: string;
    nom: string;
    adresseAdministrative: string;
    codePostalAdministratif: string;
    communeAdministrative: string;
  }
): Promise<{ id: number }> => {
  const dnaStructures = {
    create: dnaCodes.map(({ code }) => ({
      dna: {
        connectOrCreate: {
          where: { code },
          create: { code },
        },
      },
    })),
  };

  return await prisma.structure.upsert({
    where: { codeBhasile: structure.codeBhasile },
    update: { ...structure, dnaStructures },
    create: { ...structure, dnaStructures },
    select: { id: true },
  });
};

const createMinimalStructureVersion = async (
  structureId: number,
  version: {
    departementAdministratif?: string;
    communeAdministrative?: string;
    codePostalAdministratif?: string;
    adresseAdministrative?: string;
    nom?: string;
    effectiveDate?: Date;
  }
): Promise<void> => {
  await prisma.structureVersion.deleteMany({
    where: { structureId, structureVersionTransformationId: null },
  });

  const createdVersion = await prisma.structureVersion.create({
    data: {
      structureId,
      effectiveDate: version.effectiveDate ?? new Date("2020-01-01"),
      departementAdministratif: version.departementAdministratif,
      communeAdministrative: version.communeAdministrative,
      codePostalAdministratif: version.codePostalAdministratif,
      adresseAdministrative: version.adresseAdministrative,
      nom: version.nom,
    },
  });

  await prisma.dnaStructure.updateMany({
    where: { structureId, structureVersionId: null },
    data: { structureVersionId: createdVersion.id },
  });
};
