import { compareSortValues } from "@/app/utils/list.util";
import {
  DashboardRappel,
  RappelCriticite,
  RappelEchelle,
  RappelGroupBy,
  RappelGroupHeader,
  RappelGroupNode,
  RappelTaskType,
} from "@/types/dashboard.type";

export const RAPPEL_TASK_LABEL: Record<RappelTaskType, string> = {
  RENOUVELLEMENT_AUTORISATION: "Renouvellement autorisation",
  RENOUVELLEMENT_CONVENTION: "Renouvellement convention",
  EVALUATION: "Évaluation",
  RENOUVELLEMENT_CPOM: "Renouvellement CPOM",
};

export const RAPPEL_ECHELLE_OPTIONS: { value: RappelEchelle; label: string }[] =
  [
    { value: "STRUCTURE", label: "Structure" },
    { value: "CPOM", label: "CPOM" },
  ];

export const RAPPEL_GROUP_BY_OPTIONS: Record<
  RappelEchelle,
  { value: RappelGroupBy; label: string }[]
> = {
  STRUCTURE: [
    { value: "STRUCTURE", label: "Structure" },
    { value: "CPOM", label: "CPOM" },
    { value: "TASK", label: "Tâche" },
    { value: "CRITICITE", label: "Criticité" },
  ],
  CPOM: [
    { value: "CPOM", label: "CPOM" },
    { value: "TASK", label: "Tâche" },
    { value: "CRITICITE", label: "Criticité" },
  ],
};

export const parseRappelEchelle = (
  raw: string | null | undefined
): RappelEchelle =>
  RAPPEL_ECHELLE_OPTIONS.some((option) => option.value === raw)
    ? (raw as RappelEchelle)
    : "STRUCTURE";

export const resolveRappelGroupBy = (
  echelle: RappelEchelle,
  raw: string | null | undefined
): RappelGroupBy => {
  const options = RAPPEL_GROUP_BY_OPTIONS[echelle];
  return options.some((option) => option.value === raw)
    ? (raw as RappelGroupBy)
    : options[0].value;
};

const CRITICITE_RANK: Record<RappelCriticite, number> = {
  URGENT: 0,
  IMPORTANT: 1,
};

const CRITICITE_LABEL: Record<RappelCriticite, string> = {
  URGENT: "Urgent",
  IMPORTANT: "Important",
};

const countCriticites = (
  rappels: DashboardRappel[]
): { importantCount: number; urgentCount: number } => ({
  importantCount: rappels.filter((rappel) => rappel.criticite === "IMPORTANT")
    .length,
  urgentCount: rappels.filter((rappel) => rappel.criticite === "URGENT").length,
});

const sortRappels = (rappels: DashboardRappel[]): DashboardRappel[] =>
  [...rappels].sort(
    (first, second) =>
      compareSortValues(
        CRITICITE_RANK[first.criticite],
        CRITICITE_RANK[second.criticite],
        "asc",
        "number"
      ) ||
      compareSortValues(first.deadline, second.deadline, "asc", "text") ||
      compareSortValues(first.id, second.id, "asc", "text")
  );

const sortNodes = (nodes: RappelGroupNode[]): RappelGroupNode[] =>
  [...nodes].sort(
    (first, second) =>
      compareSortValues(
        first.urgentCount,
        second.urgentCount,
        "desc",
        "number"
      ) ||
      compareSortValues(
        first.importantCount,
        second.importantCount,
        "desc",
        "number"
      ) ||
      compareSortValues(first.key, second.key, "asc", "text")
  );

type KeyedHeader = { key: string; header: RappelGroupHeader };

const getStructureKeyedHeader = (
  rappel: DashboardRappel
): KeyedHeader | null => {
  if (rappel.structureId === null) {
    return null;
  }
  return {
    key: `structure-${rappel.structureId}`,
    header: {
      kind: "STRUCTURE",
      structureCodeBhasile: rappel.structureCodeBhasile,
      structureType: rappel.structureType,
      operateurName: rappel.operateurName,
      structureCommune: rappel.structureCommune,
      structureDepartement: rappel.structureDepartement,
    },
  };
};

const getCpomKeyedHeader = (rappel: DashboardRappel): KeyedHeader | null => {
  if (rappel.cpomId === null) {
    return null;
  }
  return {
    key: `cpom-${rappel.cpomId}`,
    header: {
      kind: "CPOM",
      cpomLabel: rappel.cpomLabel,
      cpomDepartements: rappel.cpomDepartements,
    },
  };
};

const getTaskKeyedHeader = (rappel: DashboardRappel): KeyedHeader => ({
  key: `task-${rappel.taskType}`,
  header: {
    kind: "TASK",
    taskType: rappel.taskType,
    taskLabel: RAPPEL_TASK_LABEL[rappel.taskType],
  },
});

const getCriticiteKeyedHeader = (rappel: DashboardRappel): KeyedHeader => ({
  key: `criticite-${rappel.criticite}`,
  header: { kind: "CRITICITE", criticite: rappel.criticite },
});

const getKeyedHeaderFor = (
  groupBy: RappelGroupBy
): ((rappel: DashboardRappel) => KeyedHeader | null) => {
  switch (groupBy) {
    case "STRUCTURE":
      return getStructureKeyedHeader;
    case "CPOM":
      return getCpomKeyedHeader;
    case "TASK":
      return getTaskKeyedHeader;
    case "CRITICITE":
      return getCriticiteKeyedHeader;
  }
};

const groupSingleLevel = (
  rappels: DashboardRappel[],
  keyedHeader: (rappel: DashboardRappel) => KeyedHeader | null
): RappelGroupNode[] => {
  const groups = new Map<
    string,
    { header: RappelGroupHeader; rappels: DashboardRappel[] }
  >();

  for (const rappel of rappels) {
    const keyed = keyedHeader(rappel);
    if (!keyed) {
      continue;
    }
    const existing = groups.get(keyed.key);
    if (existing) {
      existing.rappels.push(rappel);
    } else {
      groups.set(keyed.key, { header: keyed.header, rappels: [rappel] });
    }
  }

  const nodes = [...groups.entries()].map(([key, group]): RappelGroupNode => ({
    key,
    header: group.header,
    ...countCriticites(group.rappels),
    rappels: sortRappels(group.rappels),
  }));

  return sortNodes(nodes);
};

const groupStructureByCpom = (
  rappels: DashboardRappel[]
): RappelGroupNode[] => {
  const cpomGroups = new Map<
    string,
    { header: RappelGroupHeader; rappels: DashboardRappel[] }
  >();

  for (const rappel of rappels) {
    const keyed = getCpomKeyedHeader(rappel);
    if (!keyed) {
      continue;
    }
    const existing = cpomGroups.get(keyed.key);
    if (existing) {
      existing.rappels.push(rappel);
    } else {
      cpomGroups.set(keyed.key, { header: keyed.header, rappels: [rappel] });
    }
  }

  const nodes = [...cpomGroups.entries()].map(
    ([key, group]): RappelGroupNode => ({
      key,
      header: group.header,
      ...countCriticites(group.rappels),
      children: groupSingleLevel(group.rappels, getStructureKeyedHeader),
    })
  );

  return sortNodes(nodes);
};

export const groupRappels = (
  rappels: DashboardRappel[],
  echelle: RappelEchelle,
  groupBy: RappelGroupBy
): RappelGroupNode[] => {
  const scoped = rappels.filter((rappel) => rappel.echelle === echelle);

  if (echelle === "STRUCTURE" && groupBy === "CPOM") {
    return groupStructureByCpom(scoped);
  }

  return groupSingleLevel(scoped, getKeyedHeaderFor(groupBy));
};

export const rappelCriticiteLabel = (criticite: RappelCriticite): string =>
  CRITICITE_LABEL[criticite];
