import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

import { TestStructureData } from "./types";

// HUDA (Hébergement d'Urgence pour Demandeurs d'Asile) - Structure subventionnée
export const hudaSansCpom: TestStructureData = {
  dnaCode: "H1234",
  type: StructureType.HUDA,
  cpom: false,
  identification: {
    operateur: {
      name: "Opérateur HUDA",
      searchTerm: "Opér",
    },
    creationDate: "2017-09-01",
    public: "Famille",
    lgbt: true,
    fvvTeh: false,
    contactPrincipal: {
      prenom: "Sophie",
      nom: "Legrand",
      role: "Directeur·rice",
      email: "sophie.legrand@example.com",
      telephone: "+33345678901",
    },
    debutConvention: "2022-01-01",
    finConvention: "2025-12-31",
  },
  adresses: {
    nom: "HUDA Test",
    adresseAdministrative: {
      complete: "25 Rue de la République 69002 Lyon",
      searchTerm: "25 rue republique lyon",
    },
    typeBati: Repartition.COLLECTIF,
    sameAddress: true,
  },
  typologies: [
    { placesAutorisees: 60, pmr: 6, lgbt: 8, fvvTeh: 5 },
    { placesAutorisees: 58, pmr: 6, lgbt: 8, fvvTeh: 5 },
    { placesAutorisees: 55, pmr: 5, lgbt: 7, fvvTeh: 4 },
  ],
  documents: {
    less5Years: true,
    files: [],
  },
};

export const hudaAvecCpom: TestStructureData = {
  ...hudaSansCpom,
  cpom: true,
  identification: {
    ...hudaSansCpom.identification,
    debutCpom: "2024-01-01",
    finCpom: "2028-12-31",
  },
};
