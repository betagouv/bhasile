import { v4 as uuidv4 } from "uuid";

import { CpomApiType, CpomMillesimeApiType } from "@/schemas/api/cpom.schema";
import {
  CpomFormValues,
  CpomMillesimeFormValues,
} from "@/schemas/forms/base/cpom.schema";
import { ActeAdministratifCategoryType } from "@/types/file-upload.type";

import { getYearFromDate, getYearRange } from "./date.util";

export const getCpomDefaultValues = (cpom?: CpomApiType): CpomFormValues => {
  return {
    ...cpom,
    name: cpom?.name ?? "",
    region: cpom?.region ?? "",
    departements: cpom?.departements ?? [],
    granularity: cpom?.granularity ?? "REGIONALE",
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
    cpomMillesimes: getCpomMillesimesDefaultValues(cpom?.cpomMillesimes || []),
    actesAdministratifs: cpom?.actesAdministratifs?.length
      ? cpom?.actesAdministratifs
      : [
          {
            uuid: uuidv4(),
            category: "CPOM" as ActeAdministratifCategoryType[number],
          },
        ],
  };
};

const getCpomMillesimesDefaultValues = (
  cpomMillesimes: CpomMillesimeApiType[]
): CpomMillesimeFormValues[] => {
  const { years } = getYearRange();

  return Array(years.length)
    .fill({})
    .map((_, index) => ({
      year: years[index],
    }))
    .map((emptyCpomMillesime) => {
      const cpomMillesime = cpomMillesimes.find(
        (cpomMillesime) => cpomMillesime.year === emptyCpomMillesime.year
      );
      if (cpomMillesime) {
        return {
          ...cpomMillesime,
          year: cpomMillesime.year,
          dotationDemandee: cpomMillesime.dotationDemandee ?? undefined,
          dotationAccordee: cpomMillesime.dotationAccordee ?? undefined,
          cumulResultatNet: cpomMillesime.cumulResultatNet ?? undefined,
          repriseEtat: cpomMillesime.repriseEtat ?? undefined,
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
    });
};

export const formatCpomName = (cpom: CpomApiType): string => {
  return (
    cpom.name ||
    `${cpom.operateur?.name} - ${cpom.region} (${getYearFromDate(computeCpomDates(cpom).dateStart)} - ${getYearFromDate(computeCpomDates(cpom).dateEnd)})`
  );
};

export const computeCpomDates = (
  cpom?: Partial<CpomApiType>
): { dateStart?: string; dateEnd?: string } => {
  if (!cpom || !cpom.actesAdministratifs) {
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
