import { formatDateToIsoString } from "@/app/utils/date.util";
import { DEPARTEMENTS } from "@/constants";
import { Cpom } from "@/types/cpom.type";
import { ActeAdministratifCategoryType } from "@/types/file-upload.type";

import { CpomWithRelations } from "./cpom.type";

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

const transformStructures = (cpom: CpomWithRelations): Cpom["structures"] => {
  return cpom.structures.map((structure) => ({
    ...structure,
    dateStart: formatDateToIsoString(structure.dateStart),
    dateEnd: formatDateToIsoString(structure.dateEnd),
  }));
};
// TODO: Fix this after file uploads refactoring
const transformActesAdministratifs = (
  cpom: CpomWithRelations
): Cpom["actesAdministratifs"] => {
  return cpom.actesAdministratifs.map((acteAdministratif) => ({
    ...acteAdministratif,
    structureDnaCode: acteAdministratif.structureDnaCode ?? undefined,
    category: acteAdministratif.category as ActeAdministratifCategoryType,
    date: formatDateToIsoString(acteAdministratif.date),
    startDate: formatDateToIsoString(acteAdministratif.startDate),
    endDate: formatDateToIsoString(acteAdministratif.endDate),
  }));
};

const transformCpomMillesimes = (
  cpom: CpomWithRelations
): Cpom["cpomMillesimes"] => {
  return (
    cpom.cpomMillesimes.map((cpomMillesime) => ({
      ...cpomMillesime,
      dotationDemandee: cpomMillesime.dotationDemandee ?? undefined,
      dotationAccordee: cpomMillesime.dotationAccordee ?? undefined,
      cumulResultatNet: cpomMillesime.cumulResultatNet ?? undefined,
      repriseEtat: cpomMillesime.repriseEtat ?? undefined,
      affectationReservesFondsDedies:
        cpomMillesime.affectationReservesFondsDedies ?? undefined,
      reserveInvestissement: cpomMillesime.reserveInvestissement ?? undefined,
      chargesNonReconductibles:
        cpomMillesime.chargesNonReconductibles ?? undefined,
      reserveCompensationDeficits:
        cpomMillesime.reserveCompensationDeficits ?? undefined,
      reserveCompensationBFR: cpomMillesime.reserveCompensationBFR ?? undefined,
      reserveCompensationAmortissements:
        cpomMillesime.reserveCompensationAmortissements ?? undefined,
      fondsDedies: cpomMillesime.fondsDedies ?? undefined,
      reportANouveau: cpomMillesime.reportANouveau ?? undefined,
      autre: cpomMillesime.autre ?? undefined,
      commentaire: cpomMillesime.commentaire ?? undefined,
    })) ?? []
  );
};

export const computeCpomDates = (
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
      const currentEndDate = formatDateToIsoString(current.endDate);

      if (!currentEndDate) {
        return accumulator;
      }
      if (!accumulator) {
        return currentEndDate;
      }
      if (currentEndDate > accumulator) {
        return currentEndDate;
      }
      return accumulator;
    },
    undefined as string | undefined
  );

  const dateStart = formatDateToIsoString(
    cpom.actesAdministratifs.find(
      (acteAdministratif) => acteAdministratif.startDate
    )?.startDate
  );

  return {
    dateStart,
    dateEnd,
  };
};

const formatCpomName = (cpom: CpomWithRelations): string => {
  let zone = cpom.region;

  if (cpom.granularity === "DEPARTEMENTALE") {
    const departement = DEPARTEMENTS.find(
      (departement) => departement.numero === cpom.departements?.[0]
    );
    if (departement) {
      zone = departement.numero + " - " + departement.name;
    }
  }
  if (cpom.granularity === "INTERDEPARTEMENTALE") {
    zone = cpom.departements?.join(", ");
  }

  return cpom.name || `${cpom.operateur?.name} ${zone}`;
};
