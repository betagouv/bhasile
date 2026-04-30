import { v4 as uuidv4 } from "uuid";

import { BudgetApiType } from "@/schemas/api/budget.schema";
import {
  CpomApiRead,
  CpomDepartementApiType,
  CpomStructureApiRead,
} from "@/schemas/api/cpom.schema";
import { BudgetCpomFormValues } from "@/schemas/forms/base/cpom.schema";
import { CpomFormValues } from "@/schemas/forms/base/cpom.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import { CpomGranularity } from "@/types/cpom.type";
import { StructureType } from "@/types/structure.type";

import { getBudgetsDefaultValues } from "./budget.util";

export const getCpomDefaultValues = (cpom?: CpomApiRead): CpomFormValues => {
  const structureTypes = getCpomStructureTypes(cpom);
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
    actesAdministratifs: cpom?.actesAdministratifs?.length
      ? cpom?.actesAdministratifs.map((acteAdministratif) => ({
          ...acteAdministratif,
          startDate: acteAdministratif.startDate ?? undefined,
          endDate: acteAdministratif.endDate ?? undefined,
          date: acteAdministratif.date ?? undefined,
        }))
      : [
          {
            uuid: uuidv4(),
            category: "CONVENTION" as ActeAdministratifCategory,
          },
        ],
  };
};

export const getStructureCpomDefaultValues = (
  cpomStructures: CpomStructureApiRead[] | undefined
) => {
  if (!cpomStructures) {
    return [];
  }
  return cpomStructures.map((cpomStructure) => ({
    ...cpomStructure,
    cpom: {
      ...cpomStructure.cpom,
      granularity: cpomStructure.cpom?.granularity ?? "REGIONALE",
      region: cpomStructure.cpom?.region ?? undefined,
      departements: cpomStructure.cpom?.departements ?? undefined,
      actesAdministratifs:
        cpomStructure.cpom?.actesAdministratifs?.map((acteAdministratif) => ({
          ...acteAdministratif,
          startDate: acteAdministratif.startDate ?? undefined,
          endDate: acteAdministratif.endDate ?? undefined,
          date: acteAdministratif.date ?? undefined,
        })) ?? [],
    },
  }));
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
