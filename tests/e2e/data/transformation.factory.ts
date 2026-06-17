import { uniqueTransformationNom } from "./ids";

/**
 * Valeurs déterministes partagées par les fillers/flux de transformation.
 * Les inputs `type="date"` se remplissent au format ISO `YYYY-MM-DD`.
 */
export const TRANSFORMATION_TEST_VALUES = {
  effectiveDate: "2026-06-01",
  acteStartDate: "2026-01-01",
  acteEndDate: "2026-12-31",
  acteDate: "2026-06-01",
  creationPlaces: 15,
  extensionPlaces: 20,
  contractionPlaces: 5,
} as const;

/**
 * Nom préfixé `E2E-` saisi dans les formulaires de création — sert de handle
 * pour le cleanup (orphan-cleanup balaie les `StructureVersion` dont le `nom`
 * commence par `E2E-`, y compris pour les flux sans structure source).
 */
export const buildCreationNom = (): string => uniqueTransformationNom("CREATION");
