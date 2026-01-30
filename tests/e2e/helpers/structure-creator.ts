import { createMinimalStructure } from "@/app/api/structures/structure.repository";
import { StructureApiType } from "@/schemas/api/structure.schema";
import { StructureType } from "@/types/structure.type";

import { BASE_URL } from "./constants";
import {
  ApiError,
  ensureResponseOk,
  formatErrorMessage,
  getResponseJson,
} from "./error-handler";
import { parseAddress } from "./shared-utils";
import { TestStructureData } from "./test-data/types";

type MinimalStructureSeed = {
  dnaCode: string;
  type?: string;
  operateurName?: string;
  operateurId?: number;
  departementAdministratif?: string;
  nom?: string;
  adresseAdministrative?: string;
  codePostalAdministratif?: string;
  communeAdministrative?: string;
};

/**
 * Gets a structure's ID from its DNA code
 */
export async function getStructureId(dnaCode: string): Promise<number> {
  const headers: Record<string, string> = getAuthHeaders();

  const response = await fetch(`${BASE_URL}/api/structures/dna/${dnaCode}`, {
    headers,
  });

  await ensureResponseOk(
    response,
    formatErrorMessage("getStructureId", dnaCode)
  );

  const structure = await getResponseJson<StructureApiType | null>(response);

  if (!structure) {
    throw new ApiError(formatErrorMessage("Structure not found", dnaCode));
  }

  return structure.id;
}

/**
 * Seeds the structure with the minimum data required for the selection list.
 */
export async function seedStructureForSelection(
  testData: Partial<TestStructureData> & { dnaCode: string }
): Promise<void> {
  const adminAddress = testData.adresseAdministrative
    ? parseAddress(testData.adresseAdministrative.searchTerm)
    : { street: "", postalCode: "", city: "", department: "" };

  await createMinimalStructure({
    dnaCode: testData.dnaCode,
    type: testData.type ?? StructureType.CADA,
    operateurId: testData.operateur?.id ?? 1,
    departementAdministratif: testData.departementAdministratif,
    nom: testData.nom ?? "",
    adresseAdministrative: testData.adresseAdministrative?.complete ?? "",
    codePostalAdministratif: adminAddress.postalCode,
    communeAdministrative: adminAddress.city,
  });
}

const getPasswordCookieHeader = (): string | null => {
  const passwords = process.env.OPERATEUR_PASSWORDS;
  const password = passwords?.split(",")[0]?.trim();
  if (!password) {
    return null;
  }
  return `mot-de-passe=${password}`;
};

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    "x-dev-auth-bypass": "1",
  };
  const passwordCookie = getPasswordCookieHeader();
  if (passwordCookie) {
    headers.Cookie = passwordCookie;
  }
  return headers;
};
