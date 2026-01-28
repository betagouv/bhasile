import { StructureApiType } from "@/schemas/api/structure.schema";

import { transformTestDataToApiFormat } from "./api-data-transformer";
import { BASE_URL } from "./constants";
import {
  ApiError,
  ensureResponseOk,
  formatErrorMessage,
  getResponseJson,
} from "./error-handler";
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
 * Silently handles errors as cleanup failures are not critical
 */
export async function deleteStructureViaApi(dnaCode: string): Promise<void> {
  const headers: Record<string, string> = getAuthHeaders();

  try {
    const response = await fetch(
      `${BASE_URL}/api/test/structures?dnaCode=${dnaCode}`,
      {
        method: "DELETE",
        headers,
      }
    );

    if (!response.ok) {
      // Cleanup failures are not critical, log but don't throw
      const errorText = await response.text().catch(() => "Unknown error");
      console.warn(
        formatErrorMessage("Failed to delete structure", dnaCode, errorText)
      );
    }
  } catch (error) {
    // Network errors during cleanup are not critical
    console.warn(
      formatErrorMessage(
        "Failed to delete structure",
        dnaCode,
        error instanceof Error ? error.message : String(error)
      )
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

  await ensureResponseOk(
    response,
    formatErrorMessage("createMinimalStructureViaApi", seed.dnaCode)
  );
}

/**
 * Seeds the structure with the minimum data required for the selection list.
 */
export async function seedStructureForSelection(
  testData: Partial<TestStructureData> & { dnaCode: string }
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
