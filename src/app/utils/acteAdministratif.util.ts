import { v4 as uuidv4 } from "uuid";

import {
  CategoryDisplayRule,
  CategoryDisplayRules,
} from "@/config/acte-administratif.config";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import {
  ActeAdministratifCategory,
  StructureParentActe,
} from "@/types/acte-administratif.type";

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

export const getLatestStructureParentActeId = (
  structureActes: StructureParentActe[] | undefined,
  category: ActeAdministratifCategory
): number | undefined => {
  const candidates = (structureActes ?? []).filter(
    (acteAdministratif) => acteAdministratif.category === category
  );
  if (candidates.length === 0) {
    return undefined;
  }
  const mostRecent = candidates.reduce((latest, acteAdministratif) => {
    const acteStartDate = acteAdministratif.startDate ?? "";
    const latestStartDate = latest.startDate ?? "";
    if (acteStartDate > latestStartDate) {
      return acteAdministratif;
    }
    if (acteStartDate === latestStartDate && acteAdministratif.id > latest.id) {
      return acteAdministratif;
    }
    return latest;
  });
  return mostRecent.id;
};

// TODO: Faire en sorte de chercher le parent dans TOUS les actes administratifs, autres transformations comprises
export const resolveAvenantParentIds = (
  categoryRules: CategoryDisplayRules,
  structureActes: StructureParentActe[] | undefined
): CategoryDisplayRules =>
  Object.fromEntries(
    getCategoryRuleEntries(categoryRules).map(([category, rule]) => {
      if (!rule.avenantAlternative) {
        return [category, rule];
      }
      const parentId = getLatestStructureParentActeId(
        structureActes,
        rule.avenantAlternative.parentCategory
      );
      return [
        category,
        {
          ...rule,
          avenantAlternative: { ...rule.avenantAlternative, parentId },
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
