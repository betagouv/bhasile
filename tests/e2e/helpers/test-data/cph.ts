import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

import { TestStructureData } from "./types";

// CPH (Centre Provisoire d'Hébergement) - Structure autorisée
export const cphSansCpom: TestStructureData = {
  dnaCode: "R1234",
  type: StructureType.CPH,
  cpom: false,
  identification: {
    filiale: "Filiale CPH",
    operateur: {
      name: "Opérateur CPH",
      searchTerm: "Opér",
    },
    creationDate: "2016-03-15",
    finessCode: "987654321",
    public: "Tout public",
    lgbt: false,
    fvvTeh: true,
    contactPrincipal: {
      prenom: "Marie",
      nom: "Martin",
      role: "Directeur·rice",
      email: "marie.martin@example.com",
      telephone: "+33234567890",
    },
    contactSecondaire: {
      prenom: "Paul",
      nom: "Durand",
      role: "Responsable administratif",
      email: "paul.durand@example.com",
      telephone: "+33734567890",
    },
    debutPeriodeAutorisation: "2021-01-01",
    finPeriodeAutorisation: "2026-12-31",
  },
  adresses: {
    nom: "CPH Test",
    adresseAdministrative: {
      complete: "10 Avenue des Champs-Élysées 75008 Paris",
      searchTerm: "10 avenue champs elysees paris",
    },
    typeBati: Repartition.COLLECTIF,
    sameAddress: true,
  },
  typologies: [
    { placesAutorisees: 40, pmr: 4, lgbt: 5, fvvTeh: 6 },
    { placesAutorisees: 38, pmr: 4, lgbt: 5, fvvTeh: 6 },
    { placesAutorisees: 35, pmr: 3, lgbt: 4, fvvTeh: 5 },
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

export const cphAvecCpom: TestStructureData = {
  ...cphSansCpom,
  cpom: true,
  identification: {
    ...cphSansCpom.identification,
    debutCpom: "2023-06-01",
    finCpom: "2028-05-31",
  },
};
