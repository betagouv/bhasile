import { v4 as uuidv4 } from "uuid";

import {
  getEffectiveEndDate,
  isCurrentlyInEffect,
} from "@/app/utils/date.util";
import {
  ACTE_ADMINISTRATIF_CATEGORY_LABELS,
  CategoryDisplayRule,
  CategoryDisplayRules,
  ResolvedAvenantParent,
} from "@/config/acte-administratif.config";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import {
  ActeAdministratifCategory,
  StructureParentActe,
} from "@/types/acte-administratif.type";

export const getActesCategoriesToDisplay = (
  actesAdministratifs: ActeAdministratifApiType[] | undefined
): ActeAdministratifCategory[] => {
  const presentCategories = new Set(
    (actesAdministratifs ?? [])
      .filter((acteAdministratif) => !acteAdministratif.parentId)
      .map((acteAdministratif) => acteAdministratif.category)
  );
  return (
    Object.keys(
      ACTE_ADMINISTRATIF_CATEGORY_LABELS
    ) as ActeAdministratifCategory[]
  ).filter((category) => presentCategories.has(category));
};

const getCategoryRuleEntries = (
  categoryRules: CategoryDisplayRules
): [ActeAdministratifCategory, CategoryDisplayRule][] =>
  Object.entries(categoryRules) as [
    ActeAdministratifCategory,
    CategoryDisplayRule,
  ][];

export const getCategoryGroup = (
  category: ActeAdministratifCategory,
  alternativeCategories?: ActeAdministratifCategory[],
  avenantParentCategory?: ActeAdministratifCategory
): ActeAdministratifCategory[] => [
  ...new Set([
    category,
    ...(alternativeCategories ?? []),
    ...(avenantParentCategory ? [avenantParentCategory] : []),
  ]),
];

const toDate = (value: string | null): Date | null =>
  value ? new Date(value) : null;

export const getCurrentStructureParentActe = (
  structureActes: StructureParentActe[] | undefined,
  category: ActeAdministratifCategory,
  referenceDate: Date
): ResolvedAvenantParent | undefined => {
  let mostRecent:
    | { id: number; startDate: Date; effectiveEndDate: Date }
    | undefined;

  for (const candidate of structureActes ?? []) {
    if (candidate.category !== category) {
      continue;
    }
    const startDate = toDate(candidate.startDate);
    const effectiveEndDate = getEffectiveEndDate(
      toDate(candidate.endDate),
      candidate.children.map((child) => toDate(child.endDate))
    );
    if (
      !startDate ||
      !effectiveEndDate ||
      !isCurrentlyInEffect(startDate, effectiveEndDate, referenceDate)
    ) {
      continue;
    }

    const isMoreRecent =
      !mostRecent ||
      startDate > mostRecent.startDate ||
      (startDate.getTime() === mostRecent.startDate.getTime() &&
        candidate.id > mostRecent.id);
    if (isMoreRecent) {
      mostRecent = { id: candidate.id, startDate, effectiveEndDate };
    }
  }

  if (!mostRecent) {
    return undefined;
  }
  return {
    id: mostRecent.id,
    startYear: mostRecent.startDate.getUTCFullYear(),
    endYear: mostRecent.effectiveEndDate.getUTCFullYear(),
  };
};

// TODO: Faire en sorte de chercher le parent dans TOUS les actes administratifs, autres transformations comprises
export const resolveAvenantParentIds = (
  categoryRules: CategoryDisplayRules,
  structureActes: StructureParentActe[] | undefined,
  referenceDate: Date
): CategoryDisplayRules =>
  Object.fromEntries(
    getCategoryRuleEntries(categoryRules).map(([category, rule]) => {
      if (!rule.avenantAlternative) {
        return [category, rule];
      }
      const resolvedParent = getCurrentStructureParentActe(
        structureActes,
        rule.avenantAlternative.parentCategory,
        referenceDate
      );
      return [
        category,
        {
          ...rule,
          avenantAlternative: { ...rule.avenantAlternative, resolvedParent },
        },
      ];
    })
  );

export const getActesAdministratifsDefaultValues = (
  actesAdministratifs: ActeAdministratifFormValues[] | undefined,
  categoryRules: CategoryDisplayRules
): ActeAdministratifFormValues[] => {
  const rulesToDisplay = getCategoryRuleEntries(categoryRules).filter(
    ([, rules]) => rules.shouldShow
  );

  const missingRules = rulesToDisplay.filter(([category, rules]) => {
    const groupCategories = getCategoryGroup(
      category,
      rules.alternativeCategories,
      rules.avenantAlternative?.parentCategory
    );
    return !actesAdministratifs?.some((acteAdministratif) =>
      groupCategories.includes(
        acteAdministratif.category as ActeAdministratifCategory
      )
    );
  });

  return [
    ...(actesAdministratifs?.map((acteAdministratif) => ({
      id: acteAdministratif.id ?? undefined,
      category: acteAdministratif.category,
      date: acteAdministratif.date || undefined,
      startDate: acteAdministratif.startDate || "",
      endDate: acteAdministratif.endDate || "",
      name: acteAdministratif.name,
      parentId: acteAdministratif.parentId || undefined,
      fileUploads: acteAdministratif.fileUploads || undefined,
    })) || []),
    ...missingRules.map(([category]) => ({
      uuid: uuidv4(),
      category,
    })),
  ];
};
