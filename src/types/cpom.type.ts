import type { CpomGranularity } from "@/generated/prisma/client";

import type { CpomColumn } from "./ListColumn";

export type { CpomGranularity };

export type CpomListItem = {
  id: number;
  operateurName: string;
  granularity: CpomGranularity;
  regionName?: string;
  departementNumeros: string[];
  dateStart?: string;
  dateEnd?: string;
  structureCount: number;
  isFinalised: boolean;
};

export type CpomsQuery = {
  page: number;
  departements: string | null;
  column: CpomColumn | null;
  direction: "asc" | "desc" | null;
};
