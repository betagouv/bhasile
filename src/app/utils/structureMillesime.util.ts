import { StructureMillesimeApiType } from "@/schemas/api/structure-millesime.schema";

export const getStructureMillesimeDefaultValues = (
  structureMillesimes: StructureMillesimeApiType[]
): StructureMillesimeApiType[] => {
  return structureMillesimes.map((structureMillesime) => ({
    ...structureMillesime,
    id: structureMillesime?.id ?? undefined,
    year: structureMillesime?.year,
    cpom: structureMillesime?.cpom ?? false,
    operateurComment: structureMillesime?.operateurComment ?? undefined,
  })) as StructureMillesimeApiType[];
};
