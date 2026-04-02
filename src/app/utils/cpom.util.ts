import { v4 as uuidv4 } from "uuid";

import {
  CpomApiType,
  CpomDepartementApiType,
  CpomMillesimeApiType,
  CpomStructureApiType,
} from "@/schemas/api/cpom.schema";
import { StructureApiType } from "@/schemas/api/structure.schema";
import {
  CpomFormValues,
  CpomMillesimeFormValues,
} from "@/schemas/forms/base/cpom.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import { CpomGranularity } from "@/types/cpom.type";

import { getYearRange } from "./date.util";

export const getCpomDefaultValues = (cpom?: CpomApiType): CpomFormValues => {
  const structureTypes = [
    ...new Set(
      cpom?.structures?.map((structure) => structure.structure?.type) ?? []
    ),
  ];

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
    dateStart: computeCpomDates(cpom).dateStart ?? "",
    dateEnd: computeCpomDates(cpom).dateEnd ?? "",
    operateur: cpom?.operateur ?? { name: "", id: undefined },
    structures:
      cpom?.structures?.map((structure) => ({
        ...(structure ?? {}),
        cpom: undefined,
        dateStart: structure.dateStart ?? undefined,
        dateEnd: structure.dateEnd ?? undefined,
      })) ?? [],
    cpomMillesimes: getCpomMillesimesDefaultValues(
      cpom?.cpomMillesimes || [],
      cpom?.structures || []
    ),
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
  cpomStructures: CpomStructureApiType[] | undefined
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

const getCpomMillesimesDefaultValues = (
  cpomMillesimes: CpomMillesimeApiType[],
  structures: StructureApiType[]
): CpomMillesimeFormValues[] => {
  const { years } = getYearRange();

  return structureTypes.flatMap((structureType) =>
    Array(years.length)
      .fill({})
      .map((_, index) => ({
        year: years[index],
        type: structureType,
      }))
      .map((emptyCpomMillesime) => {
        const cpomMillesime = cpomMillesimes.find(
          (cpomMillesime) =>
            cpomMillesime.year === emptyCpomMillesime.year &&
            cpomMillesime.type === structureType
        );
        if (cpomMillesime) {
          return {
            ...cpomMillesime,
            affectationReservesFondsDedies:
              cpomMillesime.affectationReservesFondsDedies ?? undefined,
            reserveInvestissement:
              cpomMillesime.reserveInvestissement ?? undefined,
            chargesNonReconductibles:
              cpomMillesime.chargesNonReconductibles ?? undefined,
            reserveCompensationDeficits:
              cpomMillesime.reserveCompensationDeficits ?? undefined,
            reserveCompensationBFR:
              cpomMillesime.reserveCompensationBFR ?? undefined,
            reserveCompensationAmortissements:
              cpomMillesime.reserveCompensationAmortissements ?? undefined,
            fondsDedies: cpomMillesime.fondsDedies ?? undefined,
            reportANouveau: cpomMillesime.reportANouveau ?? undefined,
            autre: cpomMillesime.autre ?? undefined,
            commentaire: cpomMillesime.commentaire ?? undefined,
          };
        }
        return emptyCpomMillesime;
      })
  );
};

export const formatCpomName = (cpom: CpomApiType): string => {
  const zone =
    cpom.granularity === "REGIONALE"
      ? cpom.region?.name
      : cpom.departements
          ?.map((departement) => departement.departement?.numero)
          .join(", ");

  return `${cpom.operateur?.name || ""} ${zone || ""}`;
};

export const computeCpomDates = (
  cpom?: Partial<CpomApiType>
): { dateStart?: string; dateEnd?: string } => {
  if (!cpom) {
    return {
      dateStart: undefined,
      dateEnd: undefined,
    };
  }

  if (!cpom.actesAdministratifs?.length) {
    return {
      dateStart: undefined,
      dateEnd: undefined,
    };
  }

  const dateEnd = cpom.actesAdministratifs.reduce(
    (accumulator, current) => {
      if (!current.endDate) {
        return accumulator;
      }
      if (!accumulator) {
        return current.endDate;
      }
      if (current.endDate > accumulator) {
        return current.endDate;
      }
      return accumulator;
    },
    undefined as string | undefined
  );

  const dateStart =
    cpom.actesAdministratifs.find(
      (acteAdministratif) => acteAdministratif.startDate
    )?.startDate ?? undefined;

  return {
    dateStart,
    dateEnd,
  };
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
