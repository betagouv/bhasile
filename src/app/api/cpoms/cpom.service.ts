import { computeCpomDates } from "@/app/utils/cpom.util";
import { CpomApiRead, CpomApiWrite } from "@/schemas/api/cpom.schema";
import { CpomColumn } from "@/types/ListColumn";

import {
  countBySearch,
  createOrUpdateCpom,
  findBySearch,
  findOne,
} from "./cpom.repository";

export const getFullCpom = (cpom: CpomApiWrite): CpomApiRead => {
  const { dateStart, dateEnd } = computeCpomDates(cpom);

  return {
    ...cpom,
    dateStart,
    dateEnd,
  };
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
