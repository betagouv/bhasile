import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

import { TestStructureScenario } from "./types";

export const cada2: TestStructureScenario = {
  name: "CADA 2 - Recent, Diffus, multiple addresses, most documents at finalisation, two contacts, recent eval, no optional actes administratifs",
  formData: {
    codeBhasile: "BHA-TST-001",
    type: StructureType.CADA,
    cpom: false,
    operateur: {
      name: "Opérateur 1",
      searchTerm: "Opér",
      id: 1,
    },
    creationDate: "2025-01-02",
    finessCode: "123456789",
    public: "Tout public",
    lgbt: true,
    fvvTeh: true,
    contactPrincipal: {
      prenom: "John",
      nom: "Doe",
      role: "Directeur·rice",
      email: "john.doe@example.com",
      telephone: "+33123456789",
    },
    contactSecondaire: {
      prenom: "Jane",
      nom: "Deo",
      role: "Responsable administratif",
      email: "jane.deo@example.com",
      telephone: "+33623456789",
    },
    debutPeriodeAutorisation: "2020-01-01",
    finPeriodeAutorisation: "2025-12-31",
    nom: "Structure Test",
    adresseAdministrative: {
      complete: "1 Rue de la Paix 75001 Paris",
      searchTerm: "1 Rue de la Paix 75001 Paris",
    },
    departementAdministratif: "75",
    typeBati: Repartition.DIFFUS,
    sameAddress: false,
    adresses: [
      {
        adresseComplete: "1 Rue de la Paix 75001 Paris",
        searchTerm: "1 Rue de la Paix 75001 Paris",
        placesAutorisees: 50,
      },
      {
        adresseComplete: "2 Rue de la Paix 75001 Paris",
        searchTerm: "2 Rue de la Paix 75001 Paris",
        placesAutorisees: 150,
      },
    ],
    structureTypologies: [
      { placesAutorisees: 50, pmr: 5, lgbt: 10, fvvTeh: 8 },
      { placesAutorisees: 48, pmr: 5, lgbt: 10, fvvTeh: 8 },
    ],
    documentsFinanciers: {
      allAddedViaAjout: false,
      fileUploads: [
        {
          year: "2025",
          category: "Budget prévisionnel demandé",
          fileName: "sample.csv",
          filePath: "tests/e2e/fixtures/sample.csv",
          formKind: "finalisation",
        },
        {
          year: "2025",
          category: "Budget prévisionnel retenu (ou exécutoire)",
          fileName: "sample.csv",
          filePath: "tests/e2e/fixtures/sample.csv",
          formKind: "finalisation",
        },
      ],
    },
    finances: {
      2025: {
        ETP: "8",
        tauxEncadrement: "12,5",
        coutJournalier: "23,75",
        dotationDemandee: "120000",
        dotationAccordee: "110000",
      },
    },
    evaluations: [
      {
        date: "2025-01-01",
        notePersonne: "3",
        notePro: "2.5",
        noteStructure: "3.5",
        note: "3",
        filePath: "tests/e2e/fixtures/sample.csv",
      },
    ],
    controles: [],
    ouvertureFermeture: {
      placesACreer: "4",
      echeancePlacesACreer: "2025-09-01",
      placesAFermer: "1",
      echeancePlacesAFermer: "2025-11-15",
    },
    actesAdministratifs: [
      {
        category: "ARRETE_AUTORISATION",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        filePath: "tests/e2e/fixtures/sample.csv",
      },
      {
        category: "ARRETE_TARIFICATION",
        startDate: "2025-01-01",
        endDate: "2023-12-31",
        filePath: "tests/e2e/fixtures/sample.csv",
      },
    ],
    finalisationNotes:
      "Notes de finalisation dynamiques (CADA) : contrôle OK, suivi actif.",
  },
  modificationData: {
    public: "Personnes isolées",
    lgbt: false,
    fvvTeh: true,
    contactPrincipal: { email: "modif-cada2@example.com" },
    notes: "Notes modification CADA 2 - évolution structure.",
    debutPeriodeAutorisation: "2025-03-01",
    finPeriodeAutorisation: "2026-03-31",
    ouvertureFermeture: {
      placesACreer: "8",
      echeancePlacesACreer: "2026-09-15",
      placesAFermer: "0",
      echeancePlacesAFermer: "2026-12-01",
    },
    structureTypologies: [
      { placesAutorisees: 55, pmr: 7, lgbt: 11, fvvTeh: 9 },
      { placesAutorisees: 53, pmr: 7, lgbt: 11, fvvTeh: 9 },
    ],
    finances: {
      2026: {
        ETP: "10",
        tauxEncadrement: "11",
        coutJournalier: 25.5,
        dotationDemandee: "130000",
        dotationAccordee: "120000",
      },
      2025: {
        ETP: "10",
        tauxEncadrement: "11",
        coutJournalier: 25.5,
        dotationDemandee: "130000",
        dotationAccordee: "120000",
      },
    },
    controles: [
      {
        date: "2025-01-15",
        type: "Programmé",
        filePath: "tests/e2e/fixtures/sample.csv",
      },
    ],
    actesAdministratifs: [
      {
        category: "CONVENTION",
        startDate: "2025-01-01",
        endDate: "2026-12-31",
        filePath: "tests/e2e/fixtures/sample.csv",
      },
    ],
  },
};
