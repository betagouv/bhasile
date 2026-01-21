import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

import { TestStructureData } from "./types";

// CAES (Centre d'Accueil et d'Examen des Situations) - Structure subventionnée
export const caesSansCpom: TestStructureData = {
  dnaCode: "K1234",
  type: StructureType.CAES,
  cpom: false,
  operateur: {
    name: "Opérateur CAES",
    searchTerm: "Opér",
  },
  creationDate: "2018-04-20",
  public: "Personnes isolées",
  lgbt: false,
  fvvTeh: true,
  contactPrincipal: {
    prenom: "Pierre",
    nom: "Dubois",
    role: "Directeur·rice",
    email: "pierre.dubois@example.com",
    telephone: "+33456789012",
  },
  contactSecondaire: {
    prenom: "Claire",
    nom: "Petit",
    role: "Responsable administratif",
    email: "claire.petit@example.com",
    telephone: "+33856789012",
  },
  debutConvention: "2023-01-01",
  finConvention: "2026-12-31",
  nom: "CAES Test",
  adresseAdministrative: {
    complete: "15 Boulevard de la Liberté 13001 Marseille",
    searchTerm: "15 boulevard liberte marseille",
  },
  departementAdministratif: "13",
  typeBati: Repartition.COLLECTIF,
  sameAddress: true,
  structureTypologies: [
    { placesAutorisees: 30, pmr: 3, lgbt: 4, fvvTeh: 5 },
    { placesAutorisees: 28, pmr: 3, lgbt: 4, fvvTeh: 5 },
    { placesAutorisees: 25, pmr: 2, lgbt: 3, fvvTeh: 4 },
  ],
  documentsFinanciers: {
    files: [
      {
        year: "2025",
        category: "Budget prévisionnel demandé",
        fileName: "sample.csv",
        filePath: "tests/e2e/fixtures/sample.csv",
        formKind: "ajout",
      },
    ],
  },
};

export const caesAvecCpom: TestStructureData = {
  ...caesSansCpom,
  cpom: true,
  debutCpom: "2024-03-01",
  finCpom: "2029-02-28",
};
