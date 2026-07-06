import { CURRENT_YEAR } from "@/constants";

import { uniqueTransformationNom } from "./ids";

export const TRANSFORMATION_TEST_VALUES = {
  effectiveDate: `${CURRENT_YEAR}-06-01`,
  acteStartDate: `${CURRENT_YEAR}-01-01`,
  acteEndDate: `${CURRENT_YEAR}-12-31`,
  acteDate: `${CURRENT_YEAR}-06-01`,
  creationPlaces: 15,
  extensionPlaces: 20,
  contractionPlaces: 5,
} as const;

export const OPERATEUR_SEARCH = "Opér";

export const buildCreationNom = (): string =>
  uniqueTransformationNom("CREATION");
