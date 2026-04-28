import {
  StructureDbDetails,
  StructureDbList,
} from "@/app/api/structures/structure.db.type";
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

export const getDatesOfCurrentActeAdministratif = (
  actesAdministratifs: (
    | StructureDbDetails
    | StructureDbList
  )["actesAdministratifs"],
  type: ActeAdministratifCategory
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
        actesAdministratifs.filter(
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
  const currentActeAdministratif = actesAdministratifsWithCorrectEndDate.find(
    (acteAdministratif) => {
      if (!acteAdministratif.startDate || !acteAdministratif.endDate) {
        return false;
      }
      return (
        acteAdministratif.startDate <= now && acteAdministratif.endDate >= now
      );
    }
  );

  if (!currentActeAdministratif) {
    return [null, null];
  }

  return [currentActeAdministratif.startDate, currentActeAdministratif.endDate];
};
