import { DnaStructureApiType } from "@/schemas/api/dna-structure.schema";

export const getUniqueDnaCodesFromDnaStructures = (
  dnaStructures: Partial<DnaStructureApiType>[]
): string[] => {
  return [
    ...new Set(
      dnaStructures
        .map((dnaStructure) => dnaStructure.dna?.code?.trim())
        .filter((code): code is string => Boolean(code))
    ),
  ];
};
