import {
  getEffectiveEndDate,
  isCurrentlyInEffect,
} from "@/app/utils/date.util";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

export type ActeDateTuple = [Date | null, Date | null];

export type ActeAdministratifDates = {
  id: number;
  category: string | null;
  parentId: number | null;
  startDate: Date | null;
  endDate: Date | null;
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

export const getActeAdministratifPeriods = (
  actesAdministratifs: ActeAdministratifDates[],
  type: ActeAdministratifCategory
): ActeDateTuple[] => {
  const actes = actesAdministratifs ?? [];
  return actes
    .filter((acte) => acte.category === type && !acte.parentId)
    .map((parent): ActeDateTuple => {
      const children = actes.filter((acte) => acte.parentId === parent.id);
      return [
        parent.startDate,
        getEffectiveEndDate(
          parent.endDate,
          children.map((child) => child.endDate)
        ),
      ];
    });
};

export const getDatesOfCurrentActeAdministratif = (
  actesAdministratifs: ActeAdministratifDates[],
  type: ActeAdministratifCategory,
  current: boolean = true
): ActeDateTuple => {
  const periods = getActeAdministratifPeriods(actesAdministratifs, type).map(
    ([startDate, endDate]) => ({ startDate, endDate })
  );

  const currentActeAdministratif = current
    ? (periods.find((period) =>
        isCurrentlyInEffect(period.startDate, period.endDate, new Date())
      ) ?? getMostRecentByEndDate(periods))
    : periods[0];

  if (!currentActeAdministratif) {
    return [null, null];
  }

  return [
    currentActeAdministratif.startDate,
    currentActeAdministratif.endDate,
  ];
};
