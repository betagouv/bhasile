import {
  findAllStructureIds,
  findStructureForAnomalies,
  reconcileAnomalies,
} from "@/app/api/anomalies/anomalie.repository";
import { buildAnomalieContext } from "@/app/api/anomalies/anomalie.util";
import { getNow } from "@/app/utils/now.util";
import { computeAnomalies } from "@/lib/anomalies/anomalie.compute";

export const recomputeAnomalies = async (
  structureId: number
): Promise<void> => {
  const now = getNow();
  const dbStructure = await findStructureForAnomalies(structureId, now);

  if (dbStructure === null) {
    return;
  }

  const { detected, evaluatedCodes } = computeAnomalies(
    buildAnomalieContext(dbStructure),
    { currentYear: now.getFullYear() }
  );

  await reconcileAnomalies(structureId, detected, evaluatedCodes);
};

// Appelé après le commit d'une écriture : un échec de recalcul ne fait pas perdre les modifications.
export const recomputeAnomaliesSafely = async (
  structureId: number
): Promise<void> => {
  try {
    await recomputeAnomalies(structureId);
  } catch (error) {
    console.error(
      `Recalcul des anomalies échoué pour la structure ${structureId}`,
      error
    );
  }
};

export const recomputeAllAnomalies = async (): Promise<number> => {
  const structureIds = await findAllStructureIds();

  for (const structureId of structureIds) {
    await recomputeAnomalies(structureId);
  }

  return structureIds.length;
};
