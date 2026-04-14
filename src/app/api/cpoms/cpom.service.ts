import { computeCpomDates } from "@/app/utils/cpom.util";
import { CpomApiType } from "@/schemas/api/cpom.schema";
import { CpomViewType } from "@/types/cpom.type";

export const transformToCpomView = (cpom: CpomApiType): CpomViewType => {
  const { dateStart, dateEnd } = computeCpomDates(cpom);

  return {
    ...cpom,
    dateStart,
    dateEnd,
  };
};

export const transformToCpomsView = (cpoms: CpomApiType[]): CpomViewType[] => {
  return cpoms.map(transformToCpomView);
};
