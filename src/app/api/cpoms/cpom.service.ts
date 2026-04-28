import { recursivelySerializeDates } from "@/app/utils/date.util";
import { CpomApiRead } from "@/schemas/api/cpom.schema";

import { CpomDbDetails, CpomDbList } from "./cpom.db.type";
import { getDatesConvention } from "./cpom.util";

export const getFullCpom = (cpom: CpomDbDetails | CpomDbList): CpomApiRead => {
  const [dateStart, dateEnd] = getDatesConvention(cpom);

  return recursivelySerializeDates({
    ...cpom,
    dateStart,
    dateEnd,
  }) as CpomApiRead;
};

export const getFullCpoms = (cpoms: CpomDbList[]): CpomApiRead[] => {
  return cpoms.map(getFullCpom);
};
