import z from "zod";

import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import {
  nullishFrenchDateToISO,
  optionalFrenchDateToISO,
} from "@/app/utils/zodCustomFields";

import { structureBaseSchema } from "./structure.base.schema";

const baseCalendrierSchema = structureBaseSchema.extend({
  debutPeriodeAutorisation: nullishFrenchDateToISO(),
  finPeriodeAutorisation: nullishFrenchDateToISO(),
  debutConvention: nullishFrenchDateToISO(),
  finConvention: nullishFrenchDateToISO(),
});
export const calendrierSchema = baseCalendrierSchema
  .superRefine((data, ctx) => {
    if (isStructureAutorisee(data.type)) {
      if (!data.debutPeriodeAutorisation) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "La date de début de période d'autorisation est obligatoire pour les structures autorisées",
          path: ["debutPeriodeAutorisation"],
        });
      }

      if (!data.finPeriodeAutorisation) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "La date de fin de période d'autorisation est obligatoire pour les structures autorisées",
          path: ["finPeriodeAutorisation"],
        });
      }
    }
  })
  .refine(
    (data) => {
      if (
        isStructureSubventionnee(data.type) &&
        (!data.debutConvention || data.debutConvention === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "La date de début de convention est obligatoire pour les structures subventionnées",
      path: ["debutConvention"],
    }
  )
  .refine(
    (data) => {
      if (
        isStructureSubventionnee(data.type) &&
        (!data.finConvention || data.finConvention === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "La date de fin de convention est obligatoire pour les structures subventionnées",
      path: ["finConvention"],
    }
  )
  .refine(
    (data) => {
      if (
        data.debutPeriodeAutorisation &&
        data.finPeriodeAutorisation &&
        data.debutPeriodeAutorisation !== "" &&
        data.finPeriodeAutorisation !== ""
      ) {
        const debutDate = new Date(
          data.debutPeriodeAutorisation.split("/").reverse().join("-")
        );
        const finDate = new Date(
          data.finPeriodeAutorisation.split("/").reverse().join("-")
        );
        return finDate > debutDate;
      }
      return true;
    },
    {
      message: "La date de fin doit être postérieure à la date de début",
      path: ["finPeriodeAutorisation"],
    }
  )
  .refine(
    (data) => {
      if (
        data.debutConvention &&
        data.finConvention &&
        data.debutConvention !== "" &&
        data.finConvention !== ""
      ) {
        const debutDate = new Date(
          data.debutConvention.split("/").reverse().join("-")
        );
        const finDate = new Date(
          data.finConvention.split("/").reverse().join("-")
        );
        return finDate > debutDate;
      }
      return true;
    },
    {
      message: "La date de fin doit être postérieure à la date de début",
      path: ["finConvention"],
    }
  );

export const calendrierAutoSaveSchema = baseCalendrierSchema.partial();

export type CalendrierFormValues = z.infer<typeof calendrierSchema>;
