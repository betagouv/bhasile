import { CURRENT_YEAR } from "@/constants";
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";

import { isNullOrUndefined } from "./common.util";
import { getCpomStructureIndexAndCpomMillesimeIndexForAYear } from "./structure.util";

export const isCpomBudgetFilledForAYear = (
  cpomStructures: CpomStructureApiType[],
  year: number = CURRENT_YEAR
): boolean => {
  const { cpomStructureIndex, cpomMillesimeIndex } =
    getCpomStructureIndexAndCpomMillesimeIndexForAYear(cpomStructures, year);
  if (cpomStructureIndex === -1 || cpomMillesimeIndex === -1) {
    return false;
  }
  const cpomMillesime =
    cpomStructures[cpomStructureIndex].cpom.cpomMillesimes?.[
      cpomMillesimeIndex
    ];

  if (
    isNullOrUndefined(cpomMillesime?.dotationDemandee) &&
    isNullOrUndefined(cpomMillesime?.dotationAccordee) &&
    isNullOrUndefined(cpomMillesime?.cumulResultatNet) &&
    isNullOrUndefined(cpomMillesime?.repriseEtat) &&
    isNullOrUndefined(cpomMillesime?.affectationReservesFondsDedies) &&
    isNullOrUndefined(cpomMillesime?.reserveInvestissement) &&
    isNullOrUndefined(cpomMillesime?.chargesNonReconductibles) &&
    isNullOrUndefined(cpomMillesime?.reserveCompensationDeficits) &&
    isNullOrUndefined(cpomMillesime?.reserveCompensationBFR) &&
    isNullOrUndefined(cpomMillesime?.reserveCompensationAmortissements) &&
    isNullOrUndefined(cpomMillesime?.fondsDedies) &&
    isNullOrUndefined(cpomMillesime?.reportANouveau) &&
    isNullOrUndefined(cpomMillesime?.autre)
  ) {
    return false;
  }
  return true;
};
