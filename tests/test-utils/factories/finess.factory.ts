import { FinessApiType } from "@/schemas/api/finess.schema";

export const createDefaultFinesses = (): FinessApiType[] => [
  {
    id: 1,
    code: "123456789",
    description: "",
  },
];
