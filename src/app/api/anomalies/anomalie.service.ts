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

// La fiche structure recalcule à la lecture : une péremption de quelques heures sur la
// table n'affecte que le tableau de bord, jamais ce que l'agent a sous les yeux.
export const recomputeAllAnomalies = async (): Promise<number> => {
  const structureIds = await findAllStructureIds();

  for (const structureId of structureIds) {
    await recomputeAnomalies(structureId);
  }

  return structureIds.length;
};
