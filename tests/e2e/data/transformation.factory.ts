import { getCurrentYear } from "@/app/utils/now.util";

import { uniqueTransformationNom } from "./ids";

export const TRANSFORMATION_TEST_VALUES = {
  effectiveDate: `${getCurrentYear()}-06-01`,
  acteStartDate: `${getCurrentYear()}-01-01`,
  acteEndDate: `${getCurrentYear()}-12-31`,
  acteDate: `${getCurrentYear()}-06-01`,
  creationPlaces: 15,
  extensionPlaces: 20,
  contractionPlaces: 5,
} as const;

export const OPERATEUR_SEARCH = "Opér";

export const buildCreationNom = (): string =>
  uniqueTransformationNom("CREATION");
