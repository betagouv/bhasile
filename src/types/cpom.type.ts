import type { CpomGranularity } from "@/generated/prisma/client";

import type { Filters } from "./filters.type";
import type { SessionUser } from "./global";
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

export type CpomsQuery = Filters & {
  page: number;
  column: CpomColumn | null;
  direction: "asc" | "desc" | null;
  user: SessionUser | undefined;
};
