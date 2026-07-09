import {
  createMinimalStructure,
  createMinimalStructureVersion,
} from "@/app/api/structures/structure.repository";
import { StructureType } from "@/types/structure.type";

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
