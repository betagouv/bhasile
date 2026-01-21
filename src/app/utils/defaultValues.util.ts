import { getRepartition } from "@/app/utils/structure.util";
import { ContactApiType } from "@/schemas/api/contact.schema";
import { StructureApiType } from "@/schemas/api/structure.schema";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import { FormAdresse } from "@/schemas/forms/base/adresse.schema";
import { budgetsSchemaTypeFormValues } from "@/schemas/forms/base/budget.schema";
import { ControleFormValues } from "@/schemas/forms/base/controle.schema";
import { DocumentFinancierFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";
import { EvaluationFormValues } from "@/schemas/forms/base/evaluation.schema";
import { structureTypologieSchemaTypeFormValues } from "@/schemas/forms/base/structureTypologie.schema";
import { Repartition } from "@/types/adresse.type";
import { PublicType } from "@/types/structure.type";

import { getActesAdministratifsDefaultValues } from "./acteAdministratif.util";
import { transformApiAdressesToFormAdresses } from "./adresse.util";
import { getBudgetsDefaultValues } from "./budget.util";
import { getControlesDefaultValues } from "./controle.util";
import { getEvaluationsDefaultValues } from "./evaluation.util";
import { isStructureAutorisee } from "./structure.util";
import { getStructureMillesimeDefaultValues } from "./structureMillesime.util";
import { getStructureTypologyDefaultValues } from "./structureTypology.util";

export const getDefaultValues = ({
  structure,
}: {
  structure: StructureApiType;
}): Partial<StructureDefaultValues> => {
  const isAutorisee = isStructureAutorisee(structure.type);
  const repartition = getRepartition(structure);

  const budgets = getBudgetsDefaultValues(structure?.budgets || []);

  const structureTypologies = getStructureTypologyDefaultValues(
    structure?.structureTypologies || []
  );
  const structureMillesimes = getStructureMillesimeDefaultValues(
    structure?.structureMillesimes || []
  );
  const actesAdministratifs = getActesAdministratifsDefaultValues(structure);

  const controles = getControlesDefaultValues(structure.controles);
  const evaluations = getEvaluationsDefaultValues(
    structure.evaluations,
    isAutorisee
  );

  return {
    ...structure,
    nom: structure.nom ?? "",
    operateur: structure.operateur ?? undefined,
    creationDate: structure.creationDate ?? "",
    debutPeriodeAutorisation: isAutorisee
      ? (structure.debutPeriodeAutorisation ?? undefined)
      : undefined,
    finPeriodeAutorisation: isAutorisee
      ? (structure.finPeriodeAutorisation ?? undefined)
      : undefined,
    debutConvention: structure.debutConvention ?? undefined,
    finConvention: structure.finConvention ?? undefined,
    finessCode: structure.finessCode || undefined,
    public: structure.public
      ? PublicType[structure.public as string as keyof typeof PublicType]
      : undefined,
    filiale: structure.filiale || undefined,
    contacts: structure.contacts || [],
    adresseAdministrativeComplete: [
      structure.adresseAdministrative,
      structure.codePostalAdministratif,
      structure.communeAdministrative,
      structure.departementAdministratif,
    ]
      .filter(Boolean)
      .join(" "),
    adresseAdministrative: structure.adresseAdministrative || "",
    codePostalAdministratif: structure.codePostalAdministratif || "",
    communeAdministrative: structure.communeAdministrative || "",
    departementAdministratif: structure.departementAdministratif || "",
    typeBati: repartition,
    adresses: transformApiAdressesToFormAdresses(structure.adresses),
    placesACreer: structure.placesACreer ?? undefined,
    placesAFermer: structure.placesAFermer ?? undefined,
    echeancePlacesACreer: structure.echeancePlacesACreer ?? undefined,
    echeancePlacesAFermer: structure.echeancePlacesAFermer ?? undefined,
    date303: structure.date303 ?? undefined,
    budgets,
    structureTypologies,
    structureMillesimes,
    documentsFinanciers: structure.documentsFinanciers ?? [],
    actesAdministratifs,
    controles,
    evaluations,
  };
};

type StructureDefaultValues = Omit<
  StructureApiType,
  | "creationDate"
  | "nom"
  | "debutPeriodeAutorisation"
  | "finPeriodeAutorisation"
  | "debutConvention"
  | "finConvention"
  | "finessCode"
  | "public"
  | "filiale"
  | "contacts"
  | "adresseAdministrativeComplete"
  | "adresseAdministrative"
  | "codePostalAdministratif"
  | "communeAdministrative"
  | "departementAdministratif"
  | "adresses"
  | "placesACreer"
  | "placesAFermer"
  | "echeancePlacesACreer"
  | "echeancePlacesAFermer"
  | "actesAdministratifs"
  | "documentsFinanciers"
  | "controles"
  | "evaluations"
  | "budgets"
  | "structureTypologies"
> & {
  creationDate: string;
  nom: string;
  debutPeriodeAutorisation?: string;
  finPeriodeAutorisation?: string;
  debutConvention?: string;
  finConvention?: string;
  finessCode?: string;
  public?: PublicType;
  filiale?: string;
  contacts: ContactApiType[];
  adresseAdministrativeComplete: string;
  adresseAdministrative: string;
  codePostalAdministratif: string;
  communeAdministrative: string;
  departementAdministratif: string;
  typeBati: Repartition;
  adresses: FormAdresse[];
  placesACreer?: number;
  placesAFermer?: number;
  echeancePlacesACreer?: string;
  echeancePlacesAFermer?: string;
  documentsFinanciers: DocumentFinancierFlexibleFormValues[];
  actesAdministratifs: ActeAdministratifFormValues[];
  controles: ControleFormValues[];
  evaluations: EvaluationFormValues[];
  budgets: budgetsSchemaTypeFormValues;
  structureTypologies: structureTypologieSchemaTypeFormValues[];
};
