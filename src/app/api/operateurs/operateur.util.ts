import { roundTo } from "@/app/utils/math.util";
import { normalizeAccents } from "@/app/utils/string.util";
import { StructureType } from "@/generated/prisma/client";

import { resolveCurrentVersion } from "../structure-versions/structure-version.util";
import { StructureListLight } from "../structures/structure.db.type";
import { OperateurListRow } from "./operateur.db.type";

export type OperateurListItem = {
  id: number;
  name: string;
  nbStructures: number;
  totalPlaces: number;
  pourcentageParc: number;
  structureTypes: StructureType[];
  logo: { key: string | null };
};

type OperateurStats = {
  nbStructures: number;
  totalPlaces: number;
  structureTypes: Set<StructureType>;
};

type GroupedStructureStats = {
  statsByOperateurId: Map<number, OperateurStats>;
  globalPlaces: number;
};

export const buildTopLevelOperateurMap = (
  operateurs: OperateurListRow[]
): Map<number, number> =>
  new Map(
    operateurs.map((operateur) => [
      operateur.id,
      operateur.parentId ?? operateur.id,
    ])
  );

export const groupStructureStatsByOperateur = (
  structures: StructureListLight[],
  topLevelByOperateurId: Map<number, number>,
  now: Date
): GroupedStructureStats => {
  const statsByOperateurId = new Map<number, OperateurStats>();
  let globalPlaces = 0;

  structures.forEach((structure) => {
    const currentVersion = resolveCurrentVersion(
      structure.structureVersions,
      now
    );
    const places =
      currentVersion?.structureTypologies[0]?.placesAutorisees ?? 0;
    globalPlaces += places;

    if (structure.operateurId === null) {
      return;
    }

    const topLevelId =
      topLevelByOperateurId.get(structure.operateurId) ??
      structure.operateurId;

    const stats = statsByOperateurId.get(topLevelId) ?? {
      nbStructures: 0,
      totalPlaces: 0,
      structureTypes: new Set<StructureType>(),
    };
    stats.nbStructures += 1;
    stats.totalPlaces += places;
    if (currentVersion && structure.type) {
      stats.structureTypes.add(structure.type);
    }
    statsByOperateurId.set(topLevelId, stats);
  });

  return { statsByOperateurId, globalPlaces };
};

export const buildOperateurListItem = (
  operateur: OperateurListRow,
  stats: OperateurStats,
  globalPlaces: number
): OperateurListItem => ({
  id: operateur.id,
  name: operateur.name,
  nbStructures: stats.nbStructures,
  totalPlaces: stats.totalPlaces,
  pourcentageParc:
    globalPlaces > 0
      ? roundTo((stats.totalPlaces / globalPlaces) * 100, 2)
      : 0,
  structureTypes: [...stats.structureTypes].sort(),
  logo: { key: operateur.logo?.key ?? null },
});

export const filterOperateursBySearch = (
  operateurs: OperateurListItem[],
  search: string | null
): OperateurListItem[] => {
  if (!search) {
    return operateurs;
  }
  const normalizedSearch = normalizeAccents(search);
  return operateurs.filter((operateur) =>
    normalizeAccents(operateur.name).includes(normalizedSearch)
  );
};
