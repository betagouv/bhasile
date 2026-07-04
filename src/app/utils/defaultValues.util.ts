import { getRealCreationYear } from "@/app/utils/structure.util";
import {
  getActualisationActesAdministratifsCategoryToDisplay,
  getStructureActesAdministratifsCategoryToDisplay,
} from "@/config/structure.config";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import { FormAdresse } from "@/schemas/forms/base/adresse.schema";
import { anyBudgetFormValues } from "@/schemas/forms/base/budget.schema";
import { ControleFormValues } from "@/schemas/forms/base/controle.schema";
import { EvaluationFormValues } from "@/schemas/forms/base/evaluation.schema";
import { structureTypologieSchemaTypeFormValues } from "@/schemas/forms/base/structureTypologie.schema";

import { getActesAdministratifsDefaultValues } from "./acteAdministratif.util";
import { transformApiAdressesToFormAdresses } from "./adresse.util";
import { getBudgetsDefaultValues } from "./budget.util";
import { getControlesDefaultValues } from "./controle.util";
import { getEvaluationsDefaultValues } from "./evaluation.util";
import { getIndicateursFinanciersDefaultValues } from "./indicateurFinancier.util";
import { getStructureMillesimeDefaultValues } from "./structureMillesime.util";
import { getStructureTypologyDefaultValues } from "./structureTypology.util";

export const getDefaultValues = ({
  structure,
}: {
  structure: StructureApiRead;
}): Partial<StructureDefaultValues> => {
  const structureCreationYear = getRealCreationYear(structure);

  const adresses = transformApiAdressesToFormAdresses(structure.adresses);
  const budgets = getBudgetsDefaultValues(
    structure?.budgets || [],
    structureCreationYear
  );
  const indicateursFinanciers = getIndicateursFinanciersDefaultValues(
    structure?.indicateursFinanciers || [],
    structureCreationYear
  );
  const structureTypologies = getStructureTypologyDefaultValues(
    structure?.structureTypologies || [],
    structureCreationYear
  );
  const structureMillesimes = getStructureMillesimeDefaultValues(
    structure?.structureMillesimes || [],
    structureCreationYear
  );
  const actesAdministratifs = getActesAdministratifsDefaultValues(
    structure.actesAdministratifs,
    getStructureActesAdministratifsCategoryToDisplay(structure)
  );

  const controles = getControlesDefaultValues(structure.controles);
  const evaluations = getEvaluationsDefaultValues(
    structure.evaluations,
    structure.isAutorisee
  );

  return {
    ...structure,
    adresses,
    budgets,
    indicateursFinanciers,
    structureTypologies,
    structureMillesimes,
    actesAdministratifs,
    controles,
    evaluations,
  };
};

type StructureDefaultValues = Omit<
  StructureApiRead,
  | "actesAdministratifs"
  | "controles"
  | "evaluations"
  | "budgets"
  | "structureTypologies"
  | "adresses"
> & {
  actesAdministratifs: ActeAdministratifFormValues[];
  controles: ControleFormValues[];
  evaluations: EvaluationFormValues[];
  budgets: anyBudgetFormValues;
  structureTypologies: structureTypologieSchemaTypeFormValues[];
  adresses: FormAdresse[];
};

// Valeurs par défaut du formulaire d'actualisation : construites depuis les sous-fonctions
// (pas un wrap de getDefaultValues). La typologie de l'année cible est reprise de l'année
// précédente disponible ; on ne charge PAS les actes existants, seul un acte vide est semé.
export const getActualisationDefaultValues = ({
  structure,
  year,
}: {
  structure: StructureApiRead;
  year: number;
}): Partial<StructureDefaultValues> => {
  const structureCreationYear = getRealCreationYear(structure);

  const budgets = getBudgetsDefaultValues(
    structure?.budgets || [],
    structureCreationYear
  );
  const indicateursFinanciers = getIndicateursFinanciersDefaultValues(
    structure?.indicateursFinanciers || [],
    structureCreationYear
  );
  const structureTypologies = [
    getActualisationTypology(structure.structureTypologies ?? [], year),
  ];
  const structureMillesimes = getStructureMillesimeDefaultValues(
    structure?.structureMillesimes || [],
    structureCreationYear
  );
  const actesAdministratifs = getActesAdministratifsDefaultValues(
    [],
    getActualisationActesAdministratifsCategoryToDisplay(structure)
  );

  // adresses/controles/evaluations sont re-typés en form values par StructureDefaultValues ;
  // l'actualisation ne les rend pas, on les laisse vides plutôt que de propager la forme API brute.
  return {
    ...structure,
    adresses: [],
    controles: [],
    evaluations: [],
    budgets,
    indicateursFinanciers,
    structureTypologies,
    structureMillesimes,
    actesAdministratifs,
  };
};

const getActualisationTypology = (
  structureTypologies: StructureApiRead["structureTypologies"],
  year: number
): structureTypologieSchemaTypeFormValues => {
  const currentYear = structureTypologies.find(
    (typologie) => typologie.year === year
  );
  const source =
    currentYear ??
    [...structureTypologies]
      .filter((typologie) => typologie.year < year)
      .sort((first, second) => second.year - first.year)[0];

  return {
    year,
    placesAutorisees: source?.placesAutorisees ?? undefined,
    pmr: source?.pmr ?? undefined,
    lgbt: source?.lgbt ?? undefined,
    fvvTeh: source?.fvvTeh ?? undefined,
  };
};
