import { formatDateToIsoString } from "@/app/utils/date.util";
import { Cpom } from "@/types/cpom.type";

import { CpomWithRelations } from "./cpom.type";

export const computeCpom = (cpom: CpomWithRelations): Cpom => {
  const { dateStart, dateEnd } = computeCpomDates(cpom);
  return {
    ...cpom,
    name: cpom.name ?? undefined,
    region: cpom.region ?? "",
    departements: cpom.departements ?? [],
    granularity: cpom.granularity ?? "DEPARTEMENTALE",
    dateStart,
    dateEnd,
  };
};

const computeCpomDates = (
  cpom?: Partial<CpomWithRelations>
): { dateStart?: string; dateEnd?: string } => {
  if (!cpom) {
    return {
      dateStart: undefined,
      dateEnd: undefined,
    };
  }

  if (!cpom.actesAdministratifs?.length) {
    if (cpom.dateStart && cpom.dateEnd) {
      return {
        dateStart: formatDateToIsoString(cpom.dateStart),
        dateEnd: formatDateToIsoString(cpom.dateEnd),
      };
    }
    return {
      dateStart: undefined,
      dateEnd: undefined,
    };
  }

  const dateEnd = cpom.actesAdministratifs.reduce(
    (accumulator, current) => {
      if (!current.endDate) {
        return accumulator;
      }
      if (!accumulator) {
        return current.endDate;
      }
      if (current.endDate > accumulator) {
        return current.endDate;
      }
      return accumulator;
    },
    undefined as string | undefined
  );

  const dateStart =
    cpom.actesAdministratifs.find(
      (acteAdministratif) => acteAdministratif.startDate
    )?.startDate ?? undefined;

  return {
    dateStart,
    dateEnd,
  };
};
