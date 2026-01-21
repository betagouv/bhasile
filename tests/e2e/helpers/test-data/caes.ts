import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

import { TestStructureData } from "./types";

// CAES (Centre d'Accueil et d'Examen des Situations) - Structure subventionnée
export const caesSansCpom: TestStructureData = {
  dnaCode: "K1234",
  type: StructureType.CAES,
  cpom: false,
  identification: {
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
  },
  adresses: {
    nom: "CAES Test",
    adresseAdministrative: {
      complete: "15 Boulevard de la Liberté 13001 Marseille",
      searchTerm: "15 boulevard liberte marseille",
    },
    typeBati: Repartition.COLLECTIF,
    sameAddress: true,
  },
  typologies: [
    { placesAutorisees: 30, pmr: 3, lgbt: 4, fvvTeh: 5 },
    { placesAutorisees: 28, pmr: 3, lgbt: 4, fvvTeh: 5 },
    { placesAutorisees: 25, pmr: 2, lgbt: 3, fvvTeh: 4 },
  ],
  documents: {
    less5Years: true,
    files: [],
  },
};

export const caesAvecCpom: TestStructureData = {
  ...caesSansCpom,
  cpom: true,
  identification: {
    ...caesSansCpom.identification,
    debutCpom: "2024-03-01",
    finCpom: "2029-02-28",
  },
};
