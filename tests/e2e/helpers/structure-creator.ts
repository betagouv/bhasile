import { createMinimalStructure } from "@/app/api/structures/structure.repository";
import { StructureType } from "@/types/structure.type";

import { parseAddress } from "./shared-utils";
import { TestStructureData } from "./test-data/types";

/**
 * Seeds the structure with the minimum data required for the selection list.
 */
export async function seedStructureForSelection(
  testData: Partial<TestStructureData> & { codeBhasile: string }
): Promise<number> {
  const adminAddress = testData.adresseAdministrative
    ? parseAddress(testData.adresseAdministrative.searchTerm)
    : { street: "", postalCode: "", city: "", department: "" };

  const { id } = await createMinimalStructure(testData.dnas?.[0]?.code ?? "", {
    codeBhasile: testData.codeBhasile,
    type: testData.type ?? StructureType.CADA,
    operateurId: testData.operateur?.id ?? 1,
    departementAdministratif: testData.departementAdministratif,
    nom: testData.nom ?? "",
    adresseAdministrative: testData.adresseAdministrative?.complete ?? "",
    codePostalAdministratif: adminAddress.postalCode,
    communeAdministrative: adminAddress.city,
  });

  return id;
}
