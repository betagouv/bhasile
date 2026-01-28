import { CpomMillesimeApiType } from "@/schemas/api/cpom.schema";

type CpomStructureForMatching = {
  yearStart: number | null;
  yearEnd: number | null;
  dateStart: Date | null;
  dateEnd: Date | null;
  cpom: {
    id: number;
    yearStart: number;
    yearEnd: number;
    dateStart: Date;
    dateEnd: Date;
  };
};

export const findMatchingCpomForMillesime = (
  cpomStructures: CpomStructureForMatching[],
  millesime: CpomMillesimeApiType
) => {
  const matchingCpom = cpomStructures.find((cpomStructure) => {
    const yearStartFromDate = cpomStructure.dateStart
      ? cpomStructure.dateStart.getFullYear()
      : cpomStructure.yearStart!;
    const yearEndFromDate = cpomStructure.dateEnd
      ? cpomStructure.dateEnd.getFullYear()
      : cpomStructure.yearEnd!;
    const year = millesime.year;

    if (year < yearStartFromDate || year > yearEndFromDate) {
      return false;
    }

    const yearDebutStructure =
      yearStartFromDate ||
      cpomStructure.cpom.dateStart.getFullYear() ||
      cpomStructure.cpom.yearStart;
    const yearFinStructure =
      yearEndFromDate ||
      cpomStructure.cpom.dateEnd.getFullYear() ||
      cpomStructure.cpom.yearEnd;

    return (
      millesime.year >= yearDebutStructure && millesime.year <= yearFinStructure
    );
  });

  if (!matchingCpom) {
    return null;
  }

  return {
    cpomId: matchingCpom.cpom.id,
    year: millesime.year,
  };
};
