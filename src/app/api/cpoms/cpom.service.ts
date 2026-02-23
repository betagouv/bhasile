import { Cpom } from "@/types/cpom.type";

import { CpomWithRelations } from "./cpom.type";
import {
  computeCpomDates,
  formatCpomName,
  transformActesAdministratifs,
  transformCpomMillesimes,
  transformStructures,
} from "./cpom.util";

export const computeCpom = (cpom: CpomWithRelations): Cpom => {
  const { dateStart, dateEnd } = computeCpomDates(cpom);
  const cpomMillesimes = transformCpomMillesimes(cpom);
  const actesAdministratifs = transformActesAdministratifs(cpom);
  const structures = transformStructures(cpom);
  const formattedName = formatCpomName(cpom);
  return {
    ...cpom,
    name: cpom.name ?? undefined,
    formattedName,
    region: cpom.region ?? "",
    departements: cpom.departements ?? [],
    granularity: cpom.granularity ?? undefined,
    dateStart,
    dateEnd,
    cpomMillesimes,
    actesAdministratifs,
    structures,
  };
};
