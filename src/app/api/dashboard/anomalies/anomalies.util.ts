import { resolveCurrentVersion } from "@/app/api/structure-versions/structure-version.util";
import { isStructureFinalisedAndOpen } from "@/app/api/structures/structure.util";
import { compareSortValues, SortKind, SortValue } from "@/app/utils/list.util";
import { ANOMALIE_DEFINITIONS } from "@/lib/anomalies/anomalie.definition";
import { AnomalieCode } from "@/types/anomalie.type";
import {
  AnomalieGroupBy,
  AnomalieGroupNode,
  DashboardAnomalie,
} from "@/types/dashboard.type";
import { SessionUser } from "@/types/global";

import { isStructureInDashboardScope } from "../dashboard.util";
import { AnomalieStructure } from "./anomalies.db.type";

export const isAnomalieActive = (anomalie: {
  isJustified: boolean | null;
}): boolean => anomalie.isJustified !== true;

export type BuildDashboardAnomaliesOptions = {
  user: SessionUser;
  departementList: string[];
  operateurList: string[];
  typeList: string[];
  shouldShowIgnored: boolean;
  now: Date;
};

export const buildDashboardAnomalies = (
  structures: AnomalieStructure[],
  options: BuildDashboardAnomaliesOptions
): DashboardAnomalie[] => {
  const anomalies: DashboardAnomalie[] = [];

  for (const structure of structures) {
    if (!isEligibleStructure(structure, options)) {
      continue;
    }

    const currentVersion = resolveCurrentVersion(
      structure.structureVersions,
      options.now
    );

    for (const anomalie of structure.anomalies) {
      if (!options.shouldShowIgnored && !isAnomalieActive(anomalie)) {
        continue;
      }

      const definition = ANOMALIE_DEFINITIONS[anomalie.code];
      anomalies.push({
        id: anomalie.id,
        code: anomalie.code,
        label: definition.label,
        year: anomalie.year,
        isJustified: anomalie.isJustified,
        commentaire: anomalie.commentaire,
        actionUrl: definition.modificationSection
          ? `/structures/${structure.id}/modification/${definition.modificationSection}`
          : null,
        structureId: structure.id,
        structureCodeBhasile: structure.codeBhasile,
        structureType: structure.type,
        structureCommune: currentVersion?.communeAdministrative ?? null,
        structureDepartement: currentVersion?.departementAdministratif ?? null,
        operateurName: structure.operateur?.name ?? null,
      });
    }
  }

  return anomalies;
};

export const groupDashboardAnomalies = (
  anomalies: DashboardAnomalie[],
  groupBy: AnomalieGroupBy
): AnomalieGroupNode[] => {
  const anomaliesByKey = new Map<string, DashboardAnomalie[]>();

  for (const anomalie of anomalies) {
    const key =
      groupBy === "STRUCTURE"
        ? `structure-${anomalie.structureId}`
        : `code-${anomalie.code}`;
    const grouped = anomaliesByKey.get(key);
    if (grouped) {
      grouped.push(anomalie);
    } else {
      anomaliesByKey.set(key, [anomalie]);
    }
  }

  const nodes = [...anomaliesByKey.entries()].map(
    ([key, groupedAnomalies]) => ({
      key,
      activeCount: groupedAnomalies.filter(isAnomalieActive).length,
      anomalies: sortAnomalies(groupedAnomalies),
    })
  );

  return sortNodes(nodes, groupBy);
};

const CODE_ORDER = new Map(
  AnomalieCode.map((code, index) => [code, index] as const)
);

const isEligibleStructure = (
  structure: AnomalieStructure,
  options: BuildDashboardAnomaliesOptions
): boolean => {
  if (structure.anomalies.length === 0) {
    return false;
  }

  if (!isStructureFinalisedAndOpen(structure, options.now)) {
    return false;
  }

  if (!isStructureInDashboardScope(structure, options)) {
    return false;
  }

  return true;
};

// Les ignorées passent en bas du groupe pour que le toggle ne décale pas les actives.
const sortAnomalies = (anomalies: DashboardAnomalie[]): DashboardAnomalie[] =>
  [...anomalies].sort(
    (firstAnomalie, secondAnomalie) =>
      compareSortValues(
        isAnomalieActive(firstAnomalie) ? 0 : 1,
        isAnomalieActive(secondAnomalie) ? 0 : 1,
        "asc",
        "number"
      ) ||
      compareSortValues(
        CODE_ORDER.get(firstAnomalie.code) ?? 0,
        CODE_ORDER.get(secondAnomalie.code) ?? 0,
        "asc",
        "number"
      ) ||
      compareSortValues(
        firstAnomalie.year,
        secondAnomalie.year,
        "desc",
        "number"
      ) ||
      compareSortValues(firstAnomalie.id, secondAnomalie.id, "asc", "number")
  );

// Un ordre stable : trier sur le compteur ferait sauter les groupes à chaque justification.
const sortNodes = (
  nodes: AnomalieGroupNode[],
  groupBy: AnomalieGroupBy
): AnomalieGroupNode[] =>
  [...nodes].sort((firstNode, secondNode) => {
    const first = getNodeSortValue(firstNode, groupBy);
    const second = getNodeSortValue(secondNode, groupBy);

    return (
      compareSortValues(first.value, second.value, "asc", first.kind) ||
      compareSortValues(firstNode.key, secondNode.key, "asc", "text")
    );
  });

const getNodeSortValue = (
  node: AnomalieGroupNode,
  groupBy: AnomalieGroupBy
): { value: SortValue; kind: SortKind } => {
  const [firstAnomalie] = node.anomalies;

  if (groupBy === "STRUCTURE") {
    return { value: firstAnomalie?.structureCodeBhasile ?? null, kind: "text" };
  }

  return {
    value: firstAnomalie ? (CODE_ORDER.get(firstAnomalie.code) ?? 0) : 0,
    kind: "number",
  };
};
