import {
  StructureDbDetails,
  StructureDbList,
} from "@/app/api/structures/structure.db.type";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

export type ActeDateTuple = [Date | null, Date | null];

type ActeAdministratifWithParent = {
  id: number;
  startDate: Date | null;
  parentId: number | null;
  endDate: Date | null;
};

type ActeAdministratifWithCorrectEndDate = {
  startDate: Date | null;
  endDate: Date | null;
};

const getMostFutureDate = (dates: (Date | null | undefined)[]): Date | null => {
  const validDates = dates.filter((date): date is Date => !!date);
  if (validDates.length === 0) {
    return null;
  }
  return validDates.reduce((latestDate, currentDate) =>
    currentDate > latestDate ? currentDate : latestDate
  );
};

const getEffectiveEndDate = (
  acteAdministratif: ActeAdministratifWithParent,
  endDatesByParentId: Map<number, Date[]>
): Date | null => {
  if (!acteAdministratif.endDate) {
    return null;
  }

  const lastAvenantEndDate = getMostFutureDate(
    endDatesByParentId.get(acteAdministratif.id) ?? []
  );

  return lastAvenantEndDate ?? acteAdministratif.endDate;
};

export const getDatesOfCurrentActeAdministratif = (
  actesAdministratifs: (
    | StructureDbDetails
    | StructureDbList
  )["actesAdministratifs"],
  type: ActeAdministratifCategory
): ActeDateTuple => {
  const now = new Date();
  const actesAdministratifsWithCorrectType = (actesAdministratifs ?? []).filter(
    (acteAdministratif) => acteAdministratif.category === type
  );
  const parentActesAdministratifs = actesAdministratifsWithCorrectType.filter(
    (acteAdministratif) => !acteAdministratif.parentId
  );

  const endDatesByParentId = actesAdministratifsWithCorrectType.reduce(
    (accumulator, acteAdministratif) => {
      if (!acteAdministratif.parentId || !acteAdministratif.endDate) {
        return accumulator;
      }
      const existingEndDates =
        accumulator.get(acteAdministratif.parentId) ?? [];
      existingEndDates.push(acteAdministratif.endDate);
      accumulator.set(acteAdministratif.parentId, existingEndDates);
      return accumulator;
    },
    new Map<number, Date[]>()
  );

  const actesAdministratifsWithCorrectTypeAndCorrectEndDate =
    parentActesAdministratifs
      .map<ActeAdministratifWithCorrectEndDate>((acteAdministratif) => ({
        startDate: acteAdministratif.startDate,
        endDate: getEffectiveEndDate(acteAdministratif, endDatesByParentId),
      }))
      .filter(
        (
          acteAdministratif
        ): acteAdministratif is { startDate: Date; endDate: Date } =>
          !!acteAdministratif.startDate && !!acteAdministratif.endDate
      )
      .sort((firstActeAdministratif, secondActeAdministratif) => {
        const startDateDiff =
          secondActeAdministratif.startDate.getTime() -
          firstActeAdministratif.startDate.getTime();
        if (startDateDiff !== 0) {
          return startDateDiff;
        }
        return (
          secondActeAdministratif.endDate.getTime() -
          firstActeAdministratif.endDate.getTime()
        );
      });

  const currentActeAdministratif =
    actesAdministratifsWithCorrectTypeAndCorrectEndDate.find(
      (acteAdministratif) =>
        acteAdministratif.startDate < now && acteAdministratif.endDate > now
    );

  if (
    !currentActeAdministratif?.startDate ||
    !currentActeAdministratif.endDate
  ) {
    return [null, null];
  }

  return [currentActeAdministratif.startDate, currentActeAdministratif.endDate];
};
