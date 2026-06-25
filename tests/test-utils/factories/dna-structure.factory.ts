import { DnaStructureApiType } from "@/schemas/api/dna-structure.schema";

export const createDefaultDnaStructures = (): DnaStructureApiType[] => [
  {
    id: 1,
    description: "",
    dna: {
      code: "C0001",
    },
    startDate: undefined,
    endDate: undefined,
  },
];
