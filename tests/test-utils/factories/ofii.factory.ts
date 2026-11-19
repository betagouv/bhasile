import { OfiiReferential } from "@/app/api/ofii-imports/ofii-import.util";
import { OfiiFullRow } from "@/app/api/ofii-imports/ofii-xlsx.util";

export const createOfiiRow = (
  overrides: Partial<OfiiFullRow> = {}
): OfiiFullRow => ({
  dnaCode: "C0301",
  nom: "CADA MOULINS ADOMA",
  type: "CADA",
  operateur: "ADOMA",
  departement: "Allier",
  directionTerritoriale: "Clermont-Ferrand",
  placesAutorisees: 80,
  desinsectisation: null,
  remiseEnEtat: null,
  sousOccupation: null,
  travaux: null,
  placesIndisponibles: 2,
  tauxIndisponibilite: null,
  tauxOccupation: 0.95,
  placesOccupees: 76,
  tauxBPI: null,
  presencesInduesBPI: null,
  tauxDeboutes: null,
  presencesInduesDeboutees: null,
  ...overrides,
});

export const createOfiiReferential = (): OfiiReferential => ({
  departements: [
    {
      numero: "03",
      name: "Allier",
      regionAdministrative: { name: "Auvergne-Rhône-Alpes", code: "FR-84" },
    },
  ],
  operateurs: [{ id: 7, name: "ADOMA", ofiiNames: ["ADOMA SA"] }],
});
