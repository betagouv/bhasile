import type { StructureType } from "@/generated/prisma/client";

export type OperateurListItem = {
  id: number;
  name: string;
  nbStructures: number;
  totalPlaces: number;
  pourcentageParc: number;
  structureTypes: StructureType[];
  filiales: string[];
  logo: { key: string | null };
  logoUrl: string | null;
};
