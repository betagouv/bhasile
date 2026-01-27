import { CpomApiType, CpomMillesimeApiType } from "@/schemas/api/cpom.schema";
import {
  CpomFormValues,
  CpomMillesimeFormValues,
} from "@/schemas/forms/base/cpom.schema";

import { getYearRange } from "./date.util";

export const getCpomDefaultValues = (cpom: CpomApiType): CpomFormValues => {
  return {
    ...cpom,
    name: cpom.name ?? "",
    yearStart: cpom.yearStart ?? undefined,
    yearEnd: cpom.yearEnd ?? undefined,
    operateur: cpom.operateur ?? undefined,
    structures: cpom.structures.map((structure) => ({
      ...structure,
      cpom: undefined,
      yearStart: structure.yearStart ?? undefined,
      yearEnd: structure.yearEnd ?? undefined,
    })),
    cpomMillesimes: getCpomMillesimesDefaultValues(cpom?.cpomMillesimes || []),
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
