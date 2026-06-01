import { CpomGranularity } from "@/types/cpom.type";

import { uniqueCpomName } from "./ids";

export type CpomSeedInput = {
  name: string;
  granularity: CpomGranularity;
  operateurId: number;
  regionId?: number;
  departementNumeros?: string[];
  acteConvention?: {
    startDate: string;
    endDate: string;
  };
};

export const buildCpomSeed = (
  overrides: Partial<CpomSeedInput> = {}
): CpomSeedInput => ({
  name: uniqueCpomName(),
  granularity: "DEPARTEMENTALE",
  operateurId: 1,
  ...overrides,
});
