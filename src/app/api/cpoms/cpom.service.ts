import { CpomMillesimeApiType } from "@/schemas/api/cpom.schema";

type CpomStructureForMatching = {
  dateStart: Date | null;
  dateEnd: Date | null;
  cpom: {
    id: number;
    dateStart: Date | null;
    dateEnd: Date | null;
    initialDateEnd: Date | null;
  };
};

// TODO : checker la cohérence au moment de l'implémentation,
// notamment si deux cpoms se "superposent" sur une année.
export const findMatchingCpomForMillesime = (
  cpomStructures: CpomStructureForMatching[],
  millesime: CpomMillesimeApiType
) => {
  const year = millesime.year;

  const matchingCpom = cpomStructures.find((cpomStructure) => {
    const yearStart =
      cpomStructure.dateStart?.getFullYear() ??
      cpomStructure.cpom.dateStart?.getFullYear() ??
      null;
    const yearEnd =
      cpomStructure.dateEnd?.getFullYear() ??
      cpomStructure.cpom.initialDateEnd?.getFullYear() ??
      cpomStructure.cpom.dateEnd?.getFullYear() ??
      null;

    return (
      (yearStart === null || year >= yearStart) &&
      (yearEnd === null || year <= yearEnd)
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
