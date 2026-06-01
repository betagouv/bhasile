import { ActeAdministratif } from "@/generated/prisma/client";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

export type ActeDateTuple = [Date | null, Date | null];

const getMostFutureDate = (dates: (Date | null | undefined)[]): Date | null => {
  const validDates = dates.filter((date): date is Date => !!date);
  if (validDates.length === 0) {
    return null;
  }
  return validDates.reduce((latestDate, currentDate) =>
    currentDate > latestDate ? currentDate : latestDate
  );
};

const getMostRecentByEndDate = <ActeWithEndDate extends { endDate: Date | null }>(
  actes: ActeWithEndDate[]
): ActeWithEndDate | undefined => {
  let mostRecentActe: ActeWithEndDate | undefined;
  for (const acte of actes) {
    if (!acte.endDate) {
      continue;
    }
    if (!mostRecentActe?.endDate || acte.endDate > mostRecentActe.endDate) {
      mostRecentActe = acte;
    }
  }
  return mostRecentActe;
};

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
      const effectiveEndDate = getMostFutureDate(
        children.map((child) => child.endDate)
      );
      return {
        startDate: acteAdministratif.startDate,
        endDate: effectiveEndDate ?? acteAdministratif.endDate,
      };
    });
  const currentActeAdministratif = current
    ? (actesAdministratifsWithCorrectEndDate.find((acteAdministratif) => {
        if (!acteAdministratif.startDate || !acteAdministratif.endDate) {
          return false;
        }
        return (
          acteAdministratif.startDate <= now && acteAdministratif.endDate >= now
        );
      }) ?? getMostRecentByEndDate(actesAdministratifsWithCorrectEndDate))
    : actesAdministratifsWithCorrectEndDate[0];

  if (!currentActeAdministratif) {
    return [null, null];
  }

  return [currentActeAdministratif.startDate, currentActeAdministratif.endDate];
};
