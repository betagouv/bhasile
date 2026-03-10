import {
  getRealCreationYear,
  getRepartition,
} from "@/app/utils/structure.util";
import { ContactApiType } from "@/schemas/api/contact.schema";
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";
import { StructureApiType } from "@/schemas/api/structure.schema";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import { FormAdresse } from "@/schemas/forms/base/adresse.schema";
import { AntenneFormValues } from "@/schemas/forms/base/antenne.schema";
import { anyBudgetFormValues } from "@/schemas/forms/base/budget.schema";
import { ControleFormValues } from "@/schemas/forms/base/controle.schema";
import { DnaStructureFormValues } from "@/schemas/forms/base/dna.schema";
import { DocumentFinancierFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";
import { EvaluationFormValues } from "@/schemas/forms/base/evaluation.schema";
import { FinessFormValues } from "@/schemas/forms/base/finess.schema";
import { structureTypologieSchemaTypeFormValues } from "@/schemas/forms/base/structureTypologie.schema";
import { Repartition } from "@/types/adresse.type";
import { PublicType } from "@/types/structure.type";

import { getActesAdministratifsDefaultValues } from "./acteAdministratif.util";
import { transformApiAdressesToFormAdresses } from "./adresse.util";
import { transformApiAntennesToFormAntennes } from "./antenne.util";
import { getBudgetsDefaultValues } from "./budget.util";
import { getControlesDefaultValues } from "./controle.util";
import { getStructureCpomDefaultValues } from "./cpom.util";
import { transformApiDnaStructuresToFormDnaStructures } from "./dna.util";
import { getEvaluationsDefaultValues } from "./evaluation.util";
import { transformApiFinessesToFormFinesses } from "./finess.util";
import { isStructureAutorisee } from "./structure.util";
import { getStructureMillesimeDefaultValues } from "./structureMillesime.util";
import { getStructureTypologyDefaultValues } from "./structureTypology.util";

export const getDefaultValues = ({
  structure,
}: {
  structure: StructureApiType;
}): Partial<StructureDefaultValues> => {
  const structureCreationYear = getRealCreationYear(structure);

  const isAutorisee = isStructureAutorisee(structure.type);
  const repartition = getRepartition(structure);

  const isMultiAntenne =
    (structure.antennes?.length ?? 0) > 1 ||
    (structure.contacts?.length ?? 0) > 2;

  const isMultiDna =
    (structure.dnaStructures?.length ?? 0) > 1 ||
    (structure.finesses?.length ?? 0) > 1;

  const adresses = transformApiAdressesToFormAdresses(structure.adresses);

  const antennes = transformApiAntennesToFormAntennes(structure.antennes);

  const budgets = getBudgetsDefaultValues(
    structure?.budgets || [],
    structureCreationYear
  );

  const dnaStructures = transformApiDnaStructuresToFormDnaStructures(
    structure.dnaStructures
  );

  const finesses = transformApiFinessesToFormFinesses(structure.finesses);

  const structureTypologies = getStructureTypologyDefaultValues(
    structure?.structureTypologies || [],
    structureCreationYear
  );
  const structureMillesimes = getStructureMillesimeDefaultValues(
    structure?.structureMillesimes || [],
    structureCreationYear
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
    isMultiAntenne,
    isMultiDna,
    dnaStructures,
    finesses,
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
    adresses,
    antennes,
    date303: structure.date303 ?? undefined,
    budgets,
    structureTypologies,
    structureMillesimes,
    documentsFinanciers: structure.documentsFinanciers ?? [],
    actesAdministratifs,
    controles,
    evaluations,
    cpomStructures: getStructureCpomDefaultValues(structure.cpomStructures),
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
  | "finesses"
  | "dnaStructures"
  | "public"
  | "filiale"
  | "contacts"
  | "adresseAdministrativeComplete"
  | "adresseAdministrative"
  | "codePostalAdministratif"
  | "communeAdministrative"
  | "departementAdministratif"
  | "adresses"
  | "antennes"
  | "actesAdministratifs"
  | "documentsFinanciers"
  | "controles"
  | "evaluations"
  | "budgets"
  | "structureTypologies"
  | "cpomStructures"
> & {
  creationDate: string;
  nom: string;
  isMultiAntenne: boolean;
  isMultiDna: boolean;
  debutPeriodeAutorisation?: string;
  finPeriodeAutorisation?: string;
  debutConvention?: string;
  finConvention?: string;
  finesses: FinessFormValues[];
  dnaStructures: DnaStructureFormValues[];
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
  antennes: AntenneFormValues[];
  documentsFinanciers: DocumentFinancierFlexibleFormValues[];
  actesAdministratifs: ActeAdministratifFormValues[];
  controles: ControleFormValues[];
  evaluations: EvaluationFormValues[];
  budgets: anyBudgetFormValues;
  structureTypologies: structureTypologieSchemaTypeFormValues[];
  cpomStructures: CpomStructureApiType[];
};
