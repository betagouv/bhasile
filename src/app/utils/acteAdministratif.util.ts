import { v4 as uuidv4 } from "uuid";

import {
  CategoryDisplayRule,
  CategoryDisplayRules,
  getOperateurActesAdministratifsCategoryToDisplay,
} from "@/config/acte-administratif.config";
import { OperateurApiRead } from "@/schemas/api/operateur.schema";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

export const getActesAdministratifsDefaultValues = (
  actesAdministratifs: ActeAdministratifFormValues[] | undefined,
  categoryRules: CategoryDisplayRules
): ActeAdministratifFormValues[] => {
  const categoriesToDisplay = (
    Object.entries(categoryRules) as [
      ActeAdministratifCategory,
      CategoryDisplayRule,
    ][]
  )
    .filter(([, rules]) => rules.shouldShow)
    .map(([category]) => category);

  const missingCategories = categoriesToDisplay.filter(
    (category) =>
      !actesAdministratifs?.some(
        (acteAdministratif) => acteAdministratif.category === category
      )
  );

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
    ...missingCategories.map((category) => ({
      uuid: uuidv4(),
      category,
    })),
  ];
};

export const getOperateurActesAdministratifsDefaultValues = (
  operateur?: OperateurApiRead
): ActeAdministratifFormValues[] =>
  getActesAdministratifsDefaultValues(
    operateur?.actesAdministratifs,
    getOperateurActesAdministratifsCategoryToDisplay()
  );
