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
import { StructureTypologieSchemaTypeFormValues } from "@/schemas/forms/base/structureTypologie.schema";

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
  structureTypologies: StructureTypologieSchemaTypeFormValues[];
  adresses: FormAdresse[];
};

export const getActualisationDefaultValues = ({
  structure,
}: {
  structure: StructureApiRead;
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
  const structureTypologies = getStructureTypologyDefaultValues(
    structure?.structureTypologies || [],
    structureCreationYear
  );
  const structureMillesimes = getStructureMillesimeDefaultValues(
    structure?.structureMillesimes || [],
    structureCreationYear
  );
  const actualisationActesRules =
    getActualisationActesAdministratifsCategoryToDisplay(structure);
  const shownActeCategories = Object.entries(actualisationActesRules)
    .filter(([, rules]) => rules?.shouldShow)
    .map(([category]) => category);
  const actesAdministratifs = getActesAdministratifsDefaultValues(
    (structure.actesAdministratifs ?? []).filter(
      (acteAdministratif) =>
        acteAdministratif.category !== undefined &&
        shownActeCategories.includes(acteAdministratif.category)
    ),
    actualisationActesRules
  );

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
