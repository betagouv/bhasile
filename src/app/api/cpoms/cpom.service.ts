import { recursivelySerializeDates } from "@/app/utils/date.util";
import { CpomApiRead } from "@/schemas/api/cpom.schema";

import { CpomDbDetails, CpomDbList } from "./cpom.db.type";
import { getDatesConvention } from "./cpom.util";
import { CpomColumn } from "@/types/ListColumn";

import {
  countBySearch,
  createOrUpdateCpom,
  findBySearch,
  findOne,
} from "./cpom.repository";

export const getFullCpom = (cpom: CpomDbDetails | CpomDbList): CpomApiRead => {
  const [dateStart, dateEnd] = getDatesConvention(cpom);

  return recursivelySerializeDates({
    ...cpom,
    dateStart,
    dateEnd,
  }) as CpomApiRead;
};

export const getCpoms = async ({
  page,
  departements,
  column,
  direction,
}: {
  page: number | null;
  departements: string | null;
  column: CpomColumn | null;
  direction: "asc" | "desc" | null;
}): Promise<{ cpoms: CpomApiRead[]; totalCpoms: number }> => {
  const [cpoms, totalCpoms] = await Promise.all([
    findBySearch({
      page,
      departements,
      column,
      direction,
    }),
    countBySearch({
      departements,
    }),
  ]);

  return {
    cpoms: cpoms.map(getFullCpom),
    totalCpoms,
  };
};

export const getCpomById = async (id: number): Promise<CpomApiRead | null> => {
  const cpom = await findOne(id);
  if (!cpom) {
    return null;
  }
  return getFullCpom(cpom);
};

export const saveCpom = async (cpom: CpomApiWrite): Promise<number> => {
  return createOrUpdateCpom(cpom);
};
