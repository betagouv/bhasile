import { StructureApiType } from "@/schemas/api/structure.schema";

import { transformTestDataToApiFormat } from "./api-data-transformer";
import { BASE_URL } from "./constants";
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
 * Deletes a structure via the API endpoint (for cleanup)
 */
export async function deleteStructureViaApi(dnaCode: string): Promise<void> {
  const headers: Record<string, string> = getAuthHeaders();

  const response = await fetch(
    `${BASE_URL}/api/test/structures?dnaCode=${dnaCode}`,
    {
      method: "DELETE",
      headers,
    }
  );

  if (!response.ok) {
    console.warn(
      `Failed to delete structure ${dnaCode}:`,
      await response.text()
    );
  }
}

/**
 * Gets a structure's ID from its DNA code
 */
export async function getStructureId(dnaCode: string): Promise<number> {
  const headers: Record<string, string> = getAuthHeaders();

  const response = await fetch(`${BASE_URL}/api/structures/dna/${dnaCode}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch structure");
  }

  const structure = (await response.json()) as StructureApiType | null;

  if (!structure) {
    throw new Error(`Structure with dnaCode ${dnaCode} not found`);
  }

  return structure.id;
}

/**
 * Creates a minimal structure entry in DB so the operator update can succeed.
 */
export async function createMinimalStructureViaApi(
  seed: MinimalStructureSeed
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const response = await fetch(`${BASE_URL}/api/test/structures`, {
    method: "POST",
    headers,
    body: JSON.stringify(seed),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to create minimal structure via API (${response.status} ${response.statusText}): ${errorText}`
    );
  }
}

/**
 * Seeds the structure with the minimum data required for the selection list.
 */
export async function seedStructureForSelection(
  testData: TestStructureData
): Promise<void> {
  const apiData = transformTestDataToApiFormat(testData);
  await createMinimalStructureViaApi({
    dnaCode: testData.dnaCode,
    type: apiData.type,
    operateurName: apiData.operateur?.name,
    departementAdministratif: apiData.departementAdministratif,
    nom: apiData.nom,
    adresseAdministrative: apiData.adresseAdministrative,
    codePostalAdministratif: apiData.codePostalAdministratif,
    communeAdministrative: apiData.communeAdministrative,
  });
}

const getPasswordCookieHeader = (): string | null => {
  const passwords =
    process.env.OPERATEUR_PASSWORDS || process.env.OPERATEUR_PASSWORD;
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
