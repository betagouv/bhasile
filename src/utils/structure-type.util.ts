import { formatFirstWithRestCount } from "@/app/utils/string.util";
import { ACCEPTED_STRUCTURE_TYPES } from "@/types/structure.type";

const getTypeRank = (type: string): number => {
  const rank = ACCEPTED_STRUCTURE_TYPES.findIndex(
    (acceptedType) => acceptedType === type
  );
  return rank === -1 ? ACCEPTED_STRUCTURE_TYPES.length : rank;
};

export const buildTypesSummary = (types: string[]): string | undefined =>
  formatFirstWithRestCount(
    [...types].sort((typeA, typeB) => getTypeRank(typeA) - getTypeRank(typeB))
  );
