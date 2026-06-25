import { StructureFinessApiType } from "@/schemas/api/finess.schema";

export const createDefaultStructureFinesses = (): StructureFinessApiType[] => [
  {
    id: 1,
    description: "",
    finess: {
      id: 1,
      code: "123456789",
    },
  },
];
