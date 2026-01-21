import { TestStructureData } from "./test-data";

/**
 * Transforms test data format to API structure creation format
 */
export function transformTestDataToApiFormat(testData: TestStructureData) {
  const { identification, adresses, typologies } = testData;

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

  const adminAddress = parseAddress(adresses.adresseAdministrative.searchTerm);

  // Transform contacts to array
  const contacts = [
    {
      prenom: identification.contactPrincipal.prenom,
      nom: identification.contactPrincipal.nom,
      telephone: identification.contactPrincipal.telephone,
      email: identification.contactPrincipal.email,
      role: identification.contactPrincipal.role,
    },
  ];

  if (identification.contactSecondaire) {
    contacts.push({
      prenom: identification.contactSecondaire.prenom,
      nom: identification.contactSecondaire.nom,
      telephone: identification.contactSecondaire.telephone,
      email: identification.contactSecondaire.email,
      role: identification.contactSecondaire.role,
    });
  }

  // Transform typologies with years
  const transformedTypologies = typologies.map((typo, index) => ({
    year: 2025 - index, // 2025, 2024, 2023
    placesAutorisees: typo.placesAutorisees,
    pmr: typo.pmr,
    lgbt: typo.lgbt,
    fvvTeh: typo.fvvTeh,
  }));

  // Transform addresses with nested typologies
  const transformedAdresses = adresses.sameAddress
    ? [
        {
          adresse: adminAddress.street,
          codePostal: adminAddress.postalCode,
          commune: adminAddress.city,
          repartition: adresses.typeBati,
          adresseTypologies: [
            {
              placesAutorisees: typologies[0].placesAutorisees,
              year: 2025,
              qpv: 0, // Convert boolean to number
              logementSocial: 0, // Convert boolean to number
            },
          ],
        },
      ]
    : (adresses.adresses || []).map((addr) => {
        const parsed = parseAddress(addr.searchTerm);
        return {
          adresse: parsed.street,
          codePostal: parsed.postalCode,
          commune: parsed.city,
          repartition: addr.repartition || adresses.typeBati,
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
      name: identification.operateur.name,
    },
    filiale: identification.filiale,
    type: testData.type,
    adresseAdministrative: adminAddress.street,
    codePostalAdministratif: adminAddress.postalCode,
    communeAdministrative: adminAddress.city,
    departementAdministratif: adminAddress.department,
    nom: adresses.nom,
    debutConvention: identification.debutConvention
      ? new Date(identification.debutConvention)
      : null,
    finConvention: identification.finConvention
      ? new Date(identification.finConvention)
      : null,
    cpom: testData.cpom,
    creationDate: new Date(identification.creationDate),
    finessCode: identification.finessCode,
    lgbt: identification.lgbt,
    fvvTeh: identification.fvvTeh,
    public: identification.public,
    debutPeriodeAutorisation: identification.debutPeriodeAutorisation
      ? new Date(identification.debutPeriodeAutorisation)
      : null,
    finPeriodeAutorisation: identification.finPeriodeAutorisation
      ? new Date(identification.finPeriodeAutorisation)
      : null,
    debutCpom: identification.debutCpom
      ? new Date(identification.debutCpom)
      : null,
    finCpom: identification.finCpom ? new Date(identification.finCpom) : null,
    adresses: transformedAdresses,
    contacts,
    structureTypologies: transformedTypologies,
    documentsFinanciers: [],
    fileUploads: [], // Empty - file uploads will be skipped in finalisation tests
  };

  return apiData;
}
