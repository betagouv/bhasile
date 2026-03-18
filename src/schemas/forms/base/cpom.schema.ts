import z from "zod";

import { formatDateToIsoString } from "@/app/utils/date.util";
import {
  nullishFrenchDateToISO,
  zId,
  zSafeDecimalsNullish,
  zSafePositiveDecimalsNullish,
  zSafeYear,
} from "@/app/utils/zodCustomFields";
import { cpomDepartementApiSchema } from "@/schemas/api/cpom.schema";
import { regionApiSchema } from "@/schemas/api/region.schema";

import { acteAdministratifCpomSchema } from "./acteAdministratif.schema";
import { operateurSchema } from "./operateur.schema";

const cpomMillesimeSchema = z.object({
  id: zId(),
  year: zSafeYear(),
  dotationDemandee: zSafePositiveDecimalsNullish(),
  dotationAccordee: zSafePositiveDecimalsNullish(),
  cumulResultatNet: zSafeDecimalsNullish(),
  repriseEtat: zSafeDecimalsNullish(),
  affectationReservesFondsDedies: zSafeDecimalsNullish(),
  reserveInvestissement: zSafeDecimalsNullish(),
  chargesNonReconductibles: zSafeDecimalsNullish(),
  reserveCompensationDeficits: zSafeDecimalsNullish(),
  reserveCompensationBFR: zSafeDecimalsNullish(),
  reserveCompensationAmortissements: zSafeDecimalsNullish(),
  fondsDedies: zSafeDecimalsNullish(),
  reportANouveau: zSafeDecimalsNullish(),
  autre: zSafeDecimalsNullish(),
  commentaire: z.string().nullish(),
});

const baseCpomSchema = z.object({
  id: zId(),
  name: z.string().nullish(),
  dateStart: nullishFrenchDateToISO(),
  dateEnd: nullishFrenchDateToISO(),
  operateur: operateurSchema,
  operateurId: zId(),
  region: regionApiSchema.nullish(),
  departements: z.array(cpomDepartementApiSchema).nullish(),
  granularity: z
    .enum(["DEPARTEMENTALE", "INTERDEPARTEMENTALE", "REGIONALE"])
    .optional(),
  cpomMillesimes: z.array(cpomMillesimeSchema).optional(),
  actesAdministratifs: z.array(acteAdministratifCpomSchema),
});

export const cpomStructureSchema = z.object({
  dateStart: nullishFrenchDateToISO(),
  dateEnd: nullishFrenchDateToISO(),
  structureId: zId(),
  cpom: baseCpomSchema.optional(),
});

export const descriptionCpomSchema = z.object({
  id: zId(),
  name: z.string().nullish(),
  dateStart: nullishFrenchDateToISO(),
  dateEnd: nullishFrenchDateToISO(),
  operateur: operateurSchema,
  operateurId: zId(),
  region: regionApiSchema,
  departements: z.array(cpomDepartementApiSchema),
  granularity: z.enum(["DEPARTEMENTALE", "INTERDEPARTEMENTALE", "REGIONALE"]),
});

export const financesCpomSchema = z.object({
  cpomMillesimes: z.array(cpomMillesimeSchema),
});

export const actesAdministratifsCpomSchema = z.object({
  actesAdministratifs: z.array(acteAdministratifCpomSchema),
});

export const compositionCpomSchema = z.object({
  structures: z.array(cpomStructureSchema),
});

export const cpomSchema = descriptionCpomSchema
  .and(financesCpomSchema)
  .and(actesAdministratifsCpomSchema)
  .and(compositionCpomSchema)
  .refine(
    (data) => {
      if (data.dateStart && data.dateEnd) {
        return data.dateStart <= data.dateEnd;
      }
      return true;
    },
    {
      message: "La date de début du CPOM doit être antérieure à la date de fin",
      path: ["dateEnd"],
    }
  )
  .refine(
    (data) => {
      if (data.actesAdministratifs.length === 0) {
        return true;
      }
      const convention = data.actesAdministratifs.find(
        (acteAdministratif) => !acteAdministratif.parentId
      );
      if (!convention) {
        return true;
      }
      const avenants = data.actesAdministratifs.filter(
        (acteAdministratif) => acteAdministratif.parentId
      );
      for (const acteAdministratif of avenants) {
        const avenantEndDate = formatDateToIsoString(acteAdministratif.endDate);

        const conventionEndDate = formatDateToIsoString(convention.endDate);
        if (!avenantEndDate || !conventionEndDate) {
          continue;
        }
        if (avenantEndDate < conventionEndDate) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "La date de fin de l'avenant doit être postérieure à la date de fin du CPOM",
      path: ["actesAdministratifs"],
    }
  )
  .refine(
    (data) => {
      if (!data.dateStart || !data.dateEnd || !Array.isArray(data.structures)) {
        return true;
      }
      const cpomStart = data.dateStart;
      const cpomEnd = data.dateEnd;
      for (const structure of data.structures) {
        if (structure.dateStart) {
          if (structure.dateStart < cpomStart) {
            return false;
          }
        }
        if (structure.dateEnd) {
          if (structure.dateEnd > cpomEnd) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message:
        "Les dates de début et de fin pour chaque structure doivent être comprises dans la plage du CPOM",
      path: ["structures"],
    }
  );

export type CpomMillesimeFormValues = z.infer<typeof cpomMillesimeSchema>;

export type CpomStructureFormValues = z.infer<typeof cpomStructureSchema>;

export type CpomFormValues = z.infer<typeof cpomSchema>;
