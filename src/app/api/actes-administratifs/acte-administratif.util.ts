import {
  getEffectiveEndDate,
  isCurrentlyInEffect,
} from "@/app/utils/date.util";
import { ActeAdministratif } from "@/generated/prisma/client";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

export type ActeDateTuple = [Date | null, Date | null];

export const getDatesOfCurrentActeAdministratif = (
  actesAdministratifs: ActeAdministratif[],
  type: ActeAdministratifCategory,
  current: boolean = true
): ActeDateTuple => {
  const now = new Date();

  const actesAdministratifsWithCorrectType =
    (actesAdministratifs ?? []).filter(
      (acteAdministratif) => acteAdministratif.category === type
    ) ?? [];

  const parentActesAdministratifsWithCorrectType =
    actesAdministratifsWithCorrectType.filter(
      (acteAdministratif) => !acteAdministratif.parentId
    ) || [];

  const actesAdministratifsWithCorrectEndDate =
    parentActesAdministratifsWithCorrectType.map((acteAdministratif) => {
      const children =
        (actesAdministratifs ?? []).filter(
          (acte) => acte.parentId === acteAdministratif.id
        ) ?? [];
      return {
        startDate: acteAdministratif.startDate,
        endDate: getEffectiveEndDate(
          acteAdministratif.endDate,
          children.map((child) => child.endDate)
        ),
      };
    });
  const currentActeAdministratif = current
    ? actesAdministratifsWithCorrectEndDate.find((acteAdministratif) =>
        isCurrentlyInEffect(
          acteAdministratif.startDate,
          acteAdministratif.endDate,
          now
        )
      )
    : actesAdministratifsWithCorrectEndDate[0];

  if (!currentActeAdministratif) {
    return [null, null];
  }

  return [currentActeAdministratif.startDate, currentActeAdministratif.endDate];
};
