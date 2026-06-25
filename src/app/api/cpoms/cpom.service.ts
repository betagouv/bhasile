import { recursivelySerializeDates } from "@/app/utils/date.util";
import { CpomApiRead, CpomApiWrite } from "@/schemas/api/cpom.schema";
import { CpomColumn } from "@/types/ListColumn";

import { resolveCurrentVersionFields } from "../structure-versions/structure-version.util";
import { CpomDbDetails, CpomDbList } from "./cpom.db.type";
import {
  countBySearch,
  createOrUpdateCpom,
  findBySearch,
  findOne,
} from "./cpom.repository";
import { getDatesConvention } from "./cpom.util";

const resolveCpomStructureFields = (
  cpomStructure: CpomDbDetails["structures"][number],
  now: Date
) => {
  if (!cpomStructure.structure) {
    return cpomStructure;
  }
  return {
    ...cpomStructure,
    structure: resolveCurrentVersionFields(cpomStructure.structure, now),
  };
};

type ResolvedCpomDetails = Omit<CpomDbDetails, "structures"> & {
  structures: ReturnType<typeof resolveCpomStructureFields>[];
};

const getFullCpom = (cpom: CpomDbList | ResolvedCpomDetails): CpomApiRead => {
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
  const now = new Date();
  const resolvedCpom = {
    ...cpom,
    structures: cpom.structures.map((cpomStructure) =>
      resolveCpomStructureFields(cpomStructure, now)
    ),
  };
  return getFullCpom(resolvedCpom);
};

export const saveCpom = async (cpom: CpomApiWrite): Promise<number> => {
  return createOrUpdateCpom(cpom);
};
