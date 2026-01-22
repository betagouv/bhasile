import { parseAddress } from "./shared-utils";
import { TestStructureData } from "./test-data/types";

/**
 * Transforms test data format to API structure creation format
 */
export function transformTestDataToApiFormat(
  testData: Partial<TestStructureData> & { dnaCode: string }
) {
  const adminAddress = testData.adresseAdministrative
    ? parseAddress(testData.adresseAdministrative.searchTerm)
    : { street: "", postalCode: "", city: "", department: "" };

  // Transform contacts to array
  const contacts = testData.contactPrincipal
    ? [
        {
          prenom: testData.contactPrincipal.prenom,
          nom: testData.contactPrincipal.nom,
          telephone: testData.contactPrincipal.telephone,
          email: testData.contactPrincipal.email,
          role: testData.contactPrincipal.role,
        },
      ]
    : [];

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
  const transformedTypologies = (testData.structureTypologies || []).map(
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
          adresseTypologies:
            testData.structureTypologies &&
            testData.structureTypologies.length > 0
              ? [
                  {
                    placesAutorisees:
                      testData.structureTypologies[0].placesAutorisees,
                    year: 2025,
                    qpv: 0, // Convert boolean to number
                    logementSocial: 0, // Convert boolean to number
                  },
                ]
              : [],
        },
      ]
    : (testData.adresses || []).map((addr) => {
        const parsed = parseAddress(addr.searchTerm || addr.adresseComplete);
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
      name: testData.operateur?.name,
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
    creationDate: testData.creationDate
      ? new Date(testData.creationDate)
      : new Date(),
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
