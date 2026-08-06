import { v4 as uuidv4 } from "uuid";

import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CpomApiRead, CpomDepartementApiType } from "@/schemas/api/cpom.schema";
import { BudgetCpomFormValues } from "@/schemas/forms/base/cpom.schema";
import { CpomFormValues } from "@/schemas/forms/base/cpom.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import { CpomGranularity } from "@/types/cpom.type";
import {
  STRUCTURE_TYPES_DISPLAY_ORDER,
  StructureType,
} from "@/types/structure.type";

import { getBudgetsDefaultValues } from "./budget.util";

export const getCpomDefaultValues = (cpom?: CpomApiRead): CpomFormValues => {
  const structureTypes = getCpomStructureTypes(cpom);

  const actesAdministratifs =
    cpom?.actesAdministratifs?.map((acteAdministratif) => ({
      ...acteAdministratif,
      startDate: acteAdministratif.startDate ?? undefined,
      endDate: acteAdministratif.endDate ?? undefined,
      date: acteAdministratif.date ?? undefined,
    })) ?? [];

  const hasContratCpom = actesAdministratifs.some(
    (acteAdministratif) =>
      acteAdministratif.category === "CONVENTION_CPOM" &&
      !acteAdministratif.parentId
  );

  return {
    ...cpom,
    name: cpom?.name ?? "",
    region: {
      name: cpom?.region?.name ?? "",
      id: cpom?.region?.id ?? undefined,
      code: cpom?.region?.code ?? undefined,
    },
    departements: cpom?.departements ?? [],
    granularity: cpom?.granularity ?? "DEPARTEMENTALE",
    dateStart: cpom?.dateStart ?? "",
    dateEnd: cpom?.dateEnd ?? "",
    operateur: cpom?.operateur ?? { name: "", id: undefined },
    structures:
      cpom?.structures?.map((structure) => ({
        ...(structure ?? {}),
        cpom: undefined,
        dateStart: structure.dateStart ?? undefined,
        dateEnd: structure.dateEnd ?? undefined,
      })) ?? [],
    budgets: getCpomBudgetsDefaultValues(cpom?.budgets || [], structureTypes),
    documentsFinanciers: cpom?.documentsFinanciers ?? [],
    actesAdministratifs: hasContratCpom
      ? actesAdministratifs
      : [
          ...actesAdministratifs,
          {
            uuid: uuidv4(),
            category: "CONVENTION_CPOM" as ActeAdministratifCategory,
          },
        ],
  };
};

const getCpomBudgetsDefaultValues = (
  budgets: BudgetApiType[],
  structureTypes: StructureType[]
): BudgetCpomFormValues[] => {
  if (!structureTypes.length) {
    return [];
  }

  return structureTypes.flatMap((structureType) =>
    getBudgetsDefaultValues(budgets, undefined, structureType)
  ) as BudgetCpomFormValues[];
};

export const formatCpomName = (cpom: CpomApiRead): string => {
  const zone =
    cpom.granularity === "REGIONALE"
      ? cpom.region?.name
      : cpom.departements
          ?.map((departement) => departement.departement?.numero)
          .join(", ");

  return `${cpom.operateur?.name || ""} ${zone || ""}`;
};

export const getGranularityLabel = (
  granularity: CpomGranularity | undefined
): string => {
  const granularityLabels: Record<CpomGranularity, string> = {
    INTERDEPARTEMENTALE: "Interdépartementale",
    DEPARTEMENTALE: "Départementale",
    REGIONALE: "Régionale",
  };
  return granularity ? granularityLabels[granularity] || "" : "";
};

export const getDepartementsList = (
  departements?: CpomDepartementApiType[],
  maxLength?: number
): string => {
  if (!departements) {
    return "";
  }
  const list = departements
    .map((departement) => departement.departement?.numero)
    .join(", ");
  if (maxLength && list.length > maxLength) {
    return list.slice(0, maxLength) + "...";
  }
  return list;
};

export const getCpomStructureTypes = (cpom?: CpomApiRead): StructureType[] => {
  const structureTypes = [
    ...new Set(
      cpom?.structures?.map((structure) => structure.structure?.type) ?? []
    ),
  ].filter((type) => type !== undefined) as StructureType[];
  return structureTypes;
};

export const CPOM_ACTE_SCOPE = "CPOM";

export type CpomActeScope = StructureType | typeof CPOM_ACTE_SCOPE;

export type CpomActesScope = {
  scope: CpomActeScope;
  actesAdministratifs: ActeAdministratifApiType[];
};

const getActeScope = (
  acteAdministratif: ActeAdministratifApiType,
  actesAdministratifs: ActeAdministratifApiType[]
): CpomActeScope => {
  if (acteAdministratif.parentId) {
    const parent = actesAdministratifs.find(
      (candidate) => candidate.id === acteAdministratif.parentId
    );
    return parent?.structureType ?? CPOM_ACTE_SCOPE;
  }
  return acteAdministratif.structureType ?? CPOM_ACTE_SCOPE;
};

export const getCpomActesScopes = (cpom?: CpomApiRead): CpomActesScope[] => {
  const actesAdministratifs = cpom?.actesAdministratifs ?? [];

  const actesByScope = new Map<CpomActeScope, ActeAdministratifApiType[]>();
  for (const acteAdministratif of actesAdministratifs) {
    const scope = getActeScope(acteAdministratif, actesAdministratifs);
    const actesOfScope = actesByScope.get(scope);
    if (actesOfScope) {
      actesOfScope.push(acteAdministratif);
    } else {
      actesByScope.set(scope, [acteAdministratif]);
    }
  }

  const displayedTypes = new Set<StructureType>([
    ...getCpomStructureTypes(cpom),
    ...actesAdministratifs
      .map((acteAdministratif) => acteAdministratif.structureType)
      .filter(
        (structureType): structureType is StructureType => structureType != null
      ),
  ]);

  return [
    {
      scope: CPOM_ACTE_SCOPE,
      actesAdministratifs: actesByScope.get(CPOM_ACTE_SCOPE) ?? [],
    },
    ...STRUCTURE_TYPES_DISPLAY_ORDER.filter((structureType) =>
      displayedTypes.has(structureType)
    ).map((structureType) => ({
      scope: structureType,
      actesAdministratifs: actesByScope.get(structureType) ?? [],
    })),
  ];
};
