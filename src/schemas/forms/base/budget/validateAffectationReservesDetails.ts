import z from "zod";

import { AFFECTATION_DETAIL_FIELDS } from "@/config/budget.config";

/**
 * Checks that if the `affectationReservesFondsDedies` field is greater than 0 (or not null),
 * then the associated detail fields (reserves and dedicated funds) must not be empty.
 * If any of these fields are empty, a custom validation error is added.
 */
export const validateAffectationReservesDetails = (
  // Accepts partial data to handle missing properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  ctx: z.RefinementCtx
) => {
  if (
    data.affectationReservesFondsDedies !== null &&
    data.affectationReservesFondsDedies !== 0
  ) {
    AFFECTATION_DETAIL_FIELDS.forEach((field) => {
      const value = data[field];
      if (value === null || value === undefined) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message:
            "Ce champ est requis si l'affectation des réserves et fonds dédiés est supérieure à 0.",
        });
      }
    });
  }
};
