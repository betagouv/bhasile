import { computeCpomDates } from "@/app/utils/cpom.util";
import { CpomApiRead, CpomApiWrite } from "@/schemas/api/cpom.schema";

export const getFullCpom = (cpom: CpomApiWrite): CpomApiRead => {
  const { dateStart, dateEnd } = computeCpomDates(cpom);

  return {
    ...cpom,
    dateStart,
    dateEnd,
  };
};

export const getFullCpoms = (cpoms: CpomApiWrite[]): CpomApiRead[] => {
  return cpoms.map(getFullCpom);
};
