import { v4 as uuidv4 } from "uuid";

import {
  CategoryDisplayRule,
  CategoryDisplayRules,
} from "@/config/acte-administratif.config";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

export const getCategoryGroup = (
  category: ActeAdministratifCategory,
  alternativeCategories?: ActeAdministratifCategory[]
): ActeAdministratifCategory[] => [category, ...(alternativeCategories ?? [])];

export const getActesAdministratifsDefaultValues = (
  actesAdministratifs: ActeAdministratifFormValues[] | undefined,
  categoryRules: CategoryDisplayRules
): ActeAdministratifFormValues[] => {
  const rulesToDisplay = (
    Object.entries(categoryRules) as [
      ActeAdministratifCategory,
      CategoryDisplayRule,
    ][]
  ).filter(([, rules]) => rules.shouldShow);

  const missingRules = rulesToDisplay.filter(([category, rules]) => {
    const groupCategories = getCategoryGroup(
      category,
      rules.alternativeCategories
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
