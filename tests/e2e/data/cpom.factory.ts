import { CpomGranularity } from "@/types/cpom.type";

import { uniqueCpomName } from "./ids";

export type CpomSeedInput = {
  name: string;
  granularity: CpomGranularity;
  operateurId: number;
  regionId?: number;
  departementNumeros?: string[];
  structureIds?: number[];
  /** When set, a CONVENTION acte administratif is created with these dates.
   *  Without it, the modification UI can't resolve cpom.dateStart/dateEnd, which
   *  in turn prevents the structures list from loading on the composition page.
   *  Only seed this when the test actually needs it — some forms behave
   *  differently when the convention dates are present. */
  acteConvention?: {
    startDate: string; // ISO yyyy-mm-dd
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
