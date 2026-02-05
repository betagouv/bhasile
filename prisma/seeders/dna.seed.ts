import { Dna } from "@/generated/prisma/client";

const DNA_TYPES = ["C", "H", "K", "A"] as const;

export const createDnaList = (count: number): Omit<Dna, "id">[] => {
  const dnaList: Omit<Dna, "id">[] = [];

  for (let i = 0; i < count; i++) {
    const type = DNA_TYPES[i % DNA_TYPES.length];
    const numero = Math.floor(i / DNA_TYPES.length) + 1;
    const code = `${type}-${String(numero).padStart(3, "0")}`;

    dnaList.push({
      code,
      granularity: "STRUCTURE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return dnaList;
};
