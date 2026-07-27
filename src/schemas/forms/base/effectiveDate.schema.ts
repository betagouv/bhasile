import { isEffectiveDateValid } from "@/app/utils/transformation.util";
import { frenchDateToISO } from "@/app/utils/zodCustomFields";
import { PLACES_VERSIONED_FROM_YEAR } from "@/constants";

export const effectiveDateSchema = frenchDateToISO().refine(
  isEffectiveDateValid,
  `Il n'est pas possible de déclarer une date d'effet antérieure à ${PLACES_VERSIONED_FROM_YEAR} sur Bhasile`
);
