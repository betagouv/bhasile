import type { StructureType } from "@/generated/prisma/client";

export type OperateurListItem = {
  id: number;
  name: string;
  nbStructures: number;
  totalPlaces: number;
  pourcentageParc: number;
  structureTypes: StructureType[];
  logo: { key: string | null };
  logoUrl: string | null;
};
