import { DnaStructureApiType } from "@/schemas/api/dna-structure.schema";

export const createDefaultDnaStructures = (): DnaStructureApiType[] => [
  {
    id: 1,
    dna: {
      id: 1,
      code: "C0001",
      description: "",
    },
    startDate: undefined,
    endDate: undefined,
  },
];
