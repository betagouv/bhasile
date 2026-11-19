import { z } from "zod";

export const importMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, { error: "Mois des données invalide" })
  .nullable();
