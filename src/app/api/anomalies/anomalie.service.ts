import {
  findAllStructureIds,
  findStructurePourAnomalies,
  reconcilierAnomalies,
} from "@/app/api/anomalies/anomalie.repository";
import { buildAnomalieContexte } from "@/app/api/anomalies/anomalie.util";
import { getNow } from "@/app/utils/now.util";
import { computeAnomalies } from "@/lib/anomalies/anomalie.compute";

export const recalculerAnomalies = async (
  structureId: number
): Promise<void> => {
  const now = getNow();
  const dbStructure = await findStructurePourAnomalies(structureId, now);

  if (dbStructure === null) {
    return;
  }

  const { detectees, codesEvalues } = computeAnomalies(
    buildAnomalieContexte(dbStructure),
    { anneeCourante: now.getFullYear() }
  );

  await reconcilierAnomalies(structureId, detectees, codesEvalues);
};

// La fiche structure recalcule à la lecture : une péremption de quelques heures sur la
// table n'affecte que le tableau de bord, jamais ce que l'agent a sous les yeux.
export const recalculerToutesLesAnomalies = async (): Promise<number> => {
  const structureIds = await findAllStructureIds();

  for (const structureId of structureIds) {
    await recalculerAnomalies(structureId);
  }

  return structureIds.length;
};
