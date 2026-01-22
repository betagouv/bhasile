import { TestStructureData } from "./test-data/types";

/**
 * Transforms test data format to API structure creation format
 */
export function transformTestDataToApiFormat(testData: TestStructureData) {
  // Extract department from postal code (first 2 digits for most, or "2A"/"2B" for Corsica)
  const extractDepartment = (postalCode: string): string => {
    if (postalCode.startsWith("20")) {
      return postalCode.substring(0, 3); // Corsica: 201, 202, etc.
    }
    return postalCode.substring(0, 2);
  };

  // Parse address from autocomplete format
  const parseAddress = (searchTerm: string) => {
    // Simple parsing - in real scenario this would match the autocomplete data
    const parts = searchTerm.split(" ");
    const postalCodeMatch = parts.find((p) => /^\d{5}$/.test(p));
    const postalCode = postalCodeMatch || "75001";

    // Find city name (usually after postal code)
    const postalIndex = parts.findIndex((p) => p === postalCode);
    const city =
      postalIndex > -1 ? parts.slice(postalIndex + 1).join(" ") : "Paris";

    // Street is everything before postal code
    const street =
      postalIndex > -1 ? parts.slice(0, postalIndex).join(" ") : searchTerm;

    return {
      street: street || "1 rue de Test",
      postalCode,
      city: city || "Paris",
      department: extractDepartment(postalCode),
    };
  };

  const adminAddress = parseAddress(testData.adresseAdministrative.searchTerm);

  // Transform contacts to array
  const contacts = [
    {
      prenom: testData.contactPrincipal.prenom,
      nom: testData.contactPrincipal.nom,
      telephone: testData.contactPrincipal.telephone,
      email: testData.contactPrincipal.email,
      role: testData.contactPrincipal.role,
    },
  ];

  if (testData.contactSecondaire) {
    contacts.push({
      prenom: testData.contactSecondaire.prenom,
      nom: testData.contactSecondaire.nom,
      telephone: testData.contactSecondaire.telephone,
      email: testData.contactSecondaire.email,
      role: testData.contactSecondaire.role,
    });
  }

  // Transform typologies with years
  const transformedTypologies = testData.structureTypologies.map(
    (typo, index) => ({
      year: 2025 - index, // 2025, 2024, 2023
      placesAutorisees: typo.placesAutorisees,
      pmr: typo.pmr,
      lgbt: typo.lgbt,
      fvvTeh: typo.fvvTeh,
    })
  );

  // Transform addresses with nested typologies
  const transformedAdresses = testData.sameAddress
    ? [
        {
          adresse: adminAddress.street,
          codePostal: adminAddress.postalCode,
          commune: adminAddress.city,
          repartition: testData.typeBati,
          adresseTypologies: [
            {
              placesAutorisees:
                testData.structureTypologies[0].placesAutorisees,
              year: 2025,
              qpv: 0, // Convert boolean to number
              logementSocial: 0, // Convert boolean to number
            },
          ],
        },
      ]
    : (testData.adresses || []).map((addr) => {
        const parsed = parseAddress(addr.searchTerm);
        return {
          adresse: parsed.street,
          codePostal: parsed.postalCode,
          commune: parsed.city,
          repartition: addr.repartition || testData.typeBati,
          adresseTypologies: [
            {
              placesAutorisees: addr.placesAutorisees,
              year: 2025,
              qpv: 0,
              logementSocial: 0,
            },
          ],
        };
      });

  // Build the API payload
  const apiData = {
    dnaCode: testData.dnaCode,
    operateur: {
      id: 1, // Use known test operateur ID
      name: testData.operateur.name,
    },
    filiale: testData.filiale,
    type: testData.type,
    adresseAdministrative: adminAddress.street,
    codePostalAdministratif: adminAddress.postalCode,
    communeAdministrative: adminAddress.city,
    departementAdministratif:
      testData.departementAdministratif || adminAddress.department,
    nom: testData.nom,
    debutConvention: testData.debutConvention
      ? new Date(testData.debutConvention)
      : null,
    finConvention: testData.finConvention
      ? new Date(testData.finConvention)
      : null,
    cpom: testData.cpom,
    creationDate: new Date(testData.creationDate),
    finessCode: testData.finessCode,
    lgbt: testData.lgbt,
    fvvTeh: testData.fvvTeh,
    public: testData.public,
    debutPeriodeAutorisation: testData.debutPeriodeAutorisation
      ? new Date(testData.debutPeriodeAutorisation)
      : null,
    finPeriodeAutorisation: testData.finPeriodeAutorisation
      ? new Date(testData.finPeriodeAutorisation)
      : null,
    debutCpom: testData.debutCpom ? new Date(testData.debutCpom) : null,
    finCpom: testData.finCpom ? new Date(testData.finCpom) : null,
    adresses: transformedAdresses,
    contacts,
    structureTypologies: transformedTypologies,
    documentsFinanciers: [],
    fileUploads: [], // Empty - file uploads will be skipped in finalisation tests
  };

  return apiData;
}
