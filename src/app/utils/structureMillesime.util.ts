import { StructureMillesimeApiType } from "@/schemas/api/structure-millesime.schema";

import { getYearRange } from "./date.util";

export const getStructureMillesimeDefaultValues = (
  structureMillesimes: StructureMillesimeApiType[],
  structureCreationYear: number
): StructureMillesimeApiType[] => {
  const { years } = getYearRange();
  const yearsToDisplay = years.filter((year) => year >= structureCreationYear);

  return Array(yearsToDisplay.length)
    .fill({})
    .map((_, index) => ({
      year: yearsToDisplay[index],
    }))
    .map((emptyStructureMillesime) => {
      const structureMillesime = structureMillesimes.find(
        (structureMillesime) =>
          structureMillesime.year === emptyStructureMillesime.year
      );
      if (structureMillesime) {
        return {
          ...structureMillesime,
          year: structureMillesime.year,
          cpom: structureMillesime.cpom ?? false,
          operateurComment: structureMillesime.operateurComment ?? undefined,
        };
      }
      return emptyStructureMillesime;
    }) as StructureMillesimeApiType[];
};
