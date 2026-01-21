import { StructureApiType } from "@/schemas/api/structure.schema";

import { transformTestDataToApiFormat } from "./api-data-transformer";
import { TestStructureData } from "./test-data";

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
 * Creates a structure via the API endpoint
 * Returns the structure's dnaCode for use in tests
 */
export async function createStructureViaApi(
  testData: TestStructureData
): Promise<string> {
  await createMinimalStructureViaApi({ dnaCode: testData.dnaCode });
  const apiData = transformTestDataToApiFormat(testData);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const response = await fetch("http://localhost:3000/api/structures", {
    method: "POST",
    headers,
    body: JSON.stringify(apiData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorPayload: unknown = errorText;
    try {
      errorPayload = JSON.parse(errorText);
    } catch {
      // Keep raw text if it is not JSON.
    }
    throw new Error(
      `Failed to create structure via API (${response.status} ${response.statusText}): ${JSON.stringify(
        errorPayload
      )}`
    );
  }

  // Structure is created with state A_FINALISER by default
  return testData.dnaCode;
}

/**
 * Deletes a structure via the API endpoint (for cleanup)
 */
export async function deleteStructureViaApi(dnaCode: string): Promise<void> {
  const headers: Record<string, string> = getAuthHeaders();

  const response = await fetch(
    `http://localhost:3000/api/test/structures?dnaCode=${dnaCode}`,
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

  const response = await fetch(
    `http://localhost:3000/api/structures/dna/${dnaCode}`,
    {
      headers,
    }
  );

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
 * Marks a finalisation step as validated for a given structure.
 */
export async function markFinalisationStepValidated(
  structureId: number,
  dnaCode: string,
  stepSlug: string
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const response = await fetch(
    `http://localhost:3000/api/structures/${structureId}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch structure ${dnaCode}`);
  }

  const structure = (await response.json()) as StructureApiType | null;
  if (!structure) {
    throw new Error(`Structure with dnaCode ${dnaCode} not found`);
  }

  const forms = structure.forms?.map((form) => {
    if (form.formDefinition.name !== "finalisation") {
      return form;
    }
    if (!form.formSteps) {
      return form;
    }
    return {
      ...form,
      formSteps: form.formSteps.map((step) => {
        if (step.stepDefinition.slug === stepSlug) {
          return { ...step, status: "VALIDE" };
        }
        return step;
      }),
    };
  });

  const updateResponse = await fetch("http://localhost:3000/api/structures", {
    method: "PUT",
    headers,
    body: JSON.stringify({ dnaCode, forms }),
  });

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    throw new Error(
      `Failed to update finalisation step ${stepSlug} for ${dnaCode}: ${errorText}`
    );
  }
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

  const response = await fetch("http://localhost:3000/api/test/structures", {
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
