import { StructureType } from "@/generated/prisma/client";
import {
  BatiStat,
  TypeStructureStat,
} from "@/schemas/api/statistique.schema";
import { REPARTITION_DISPLAY_ORDER } from "@/types/adresse.type";
import { STRUCTURE_TYPES_DISPLAY_ORDER } from "@/types/structure.type";

export const sortByDefinedOrder = <T>(items: Iterable<T>, order: T[]): T[] =>
  [...new Set(items)].sort(
    (itemA, itemB) => order.indexOf(itemA) - order.indexOf(itemB)
  );

export const fillStructureTypes = (
  stats: TypeStructureStat[]
): TypeStructureStat[] => {
  const map = new Map(
    stats
      .filter((stat): stat is TypeStructureStat & { type: StructureType } =>
        stat.type !== null
      )
      .map((stat) => [stat.type, stat])
  );
  return STRUCTURE_TYPES_DISPLAY_ORDER.map((type) => ({
    type,
    structures: map.get(type)?.structures ?? 0,
    places: map.get(type)?.places ?? 0,
  }));
};

export const fillBatis = (stats: BatiStat[]): BatiStat[] => {
  const map = new Map(stats.map((stat) => [stat.bati, stat]));
  return REPARTITION_DISPLAY_ORDER.map((bati) => ({
    bati,
    structures: map.get(bati)?.structures ?? 0,
    places: map.get(bati)?.places ?? 0,
  }));
};

export const emptyStructureTypes = (): TypeStructureStat[] =>
  fillStructureTypes([]);

export const emptyBatis = (): BatiStat[] => fillBatis([]);
