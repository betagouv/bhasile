import { CpomMillesimeApiType } from "@/schemas/api/cpom.schema";

import { getYearRange } from "./date.util";

export const getCpomMillesimesDefaultValues = (
  cpomMillesimes: CpomMillesimeApiType[]
): CpomMillesimeApiType[] => {
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
      return cpomMillesime ?? emptyCpomMillesime;
    });
};
