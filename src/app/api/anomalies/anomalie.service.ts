import {
  findAllStructureIds,
  findAnomalieForUpdate,
  findStructureForAnomalies,
  reconcileAnomalies,
  updateAnomalieJustification,
} from "@/app/api/anomalies/anomalie.repository";
import { buildAnomalieContext } from "@/app/api/anomalies/anomalie.util";
import { findUserIdByEmail } from "@/app/api/users/user.repository";
import { DomainError } from "@/app/utils/domainError.util";
import { getNow } from "@/app/utils/now.util";
import { Prisma } from "@/generated/prisma/client";
import { computeAnomalies } from "@/lib/anomalies/anomalie.compute";
import { AnomalieApiUpdate } from "@/schemas/api/anomalie.schema";

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

export const getAnomalieForUpdate = async (
  id: number
): Promise<{
  structureId: number;
  departementAdministratif: string | null;
} | null> => {
  const anomalie = await findAnomalieForUpdate(id);

  if (anomalie === null) {
    return null;
  }

  return {
    structureId: anomalie.structureId,
    departementAdministratif: anomalie.structure.departementAdministratif,
  };
};

export const setAnomalieJustification = async (
  input: AnomalieApiUpdate,
  email: string
): Promise<void> => {
  if (!input.isJustified) {
    await updateJustificationOrThrowNotFound(input.id, { isJustified: false });
    return;
  }

  const user = await findUserIdByEmail(email);

  if (user === null) {
    throw new DomainError("Utilisateur introuvable", 401);
  }

  await updateJustificationOrThrowNotFound(input.id, {
    isJustified: true,
    commentaire: input.commentaire,
    justifiedById: user.id,
    justifiedAt: getNow(),
  });
};

const updateJustificationOrThrowNotFound = async (
  id: number,
  data: Parameters<typeof updateAnomalieJustification>[1]
): Promise<void> => {
  try {
    await updateAnomalieJustification(id, data);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new DomainError("Anomalie introuvable", 404);
    }
    throw error;
  }
};

export const recomputeAllAnomalies = async (): Promise<number> => {
  const structureIds = await findAllStructureIds();

  for (const structureId of structureIds) {
    await recomputeAnomalies(structureId);
  }

  return structureIds.length;
};
