import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";

import { Operateur } from "./operateur.type";

export const CpomGranularity = [
  "DEPARTEMENTALE",
  "INTERDEPARTEMENTALE",
  "REGIONALE",
] as const;

export type CpomGranularity = (typeof CpomGranularity)[number];

export type CpomMillesime = {
  id?: number;
  year: number;
  dotationDemandee?: number;
  dotationAccordee?: number;
  cumulResultatNet?: number;
  repriseEtat?: number;
  affectationReservesFondsDedies?: number;
  reserveInvestissement?: number;
  chargesNonReconductibles?: number;
  reserveCompensationDeficits?: number;
  reserveCompensationBFR?: number;
  reserveCompensationAmortissements?: number;
  fondsDedies?: number;
  reportANouveau?: number;
  autre?: number;
  commentaire?: string;
};

export type CpomStructure = {
  id?: number;
  cpomId: number;
  cpom?: Cpom;
  structureId: number;
  dateStart?: string;
  dateEnd?: string;
};

export type Cpom = {
  id?: number;
  name?: string;
  operateur?: Operateur;
  operateurId?: number;
  region?: string;
  departements?: string[];
  granularity?: CpomGranularity;
  dateStart?: string;
  dateEnd?: string;
  cpomMillesimes?: CpomMillesime[];
  actesAdministratifs?: ActeAdministratifApiType[];
  structures?: CpomStructure[];
};
