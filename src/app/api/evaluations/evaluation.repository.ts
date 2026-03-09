import { EvaluationApiType } from "@/schemas/api/evaluation.schema";
import { PrismaTransaction } from "@/types/prisma.type";

const deleteEvaluations = async (
  tx: PrismaTransaction,
  evaluationsToKeep: EvaluationApiType[],
  structureDnaCode: string
): Promise<void> => {
  const allEvaluations = await tx.evaluation.findMany({
    where: { structureDnaCode: structureDnaCode },
  });
  const evaluationsToDelete = allEvaluations.filter(
    (evaluation) =>
      !evaluationsToKeep.some(
        (evaluationToKeep) => evaluationToKeep.id === evaluation.id
      )
  );
  await Promise.all(
    evaluationsToDelete.map((evaluation) =>
      tx.evaluation.delete({ where: { id: evaluation.id } })
    )
  );
};

export const createOrUpdateEvaluations = async (
  tx: PrismaTransaction,
  evaluations: EvaluationApiType[] | undefined,
  structureDnaCode: string
): Promise<void> => {
  if (!evaluations || evaluations.length === 0) {
    return;
  }

  await deleteEvaluations(tx, evaluations, structureDnaCode);

  await Promise.all(
    (evaluations || []).map((evaluation) => {
      return tx.evaluation.upsert({
        where: { id: evaluation.id || 0 },
        update: {
          date: evaluation.date,
          notePersonne: evaluation.notePersonne,
          notePro: evaluation.notePro,
          noteStructure: evaluation.noteStructure,
          note: evaluation.note,
          fileUploads: {
            connect: (evaluation.fileUploads ?? []).map((fileUpload) => ({
              key: fileUpload.key,
            })),
          },
        },
        create: {
          structureDnaCode,
          date: evaluation.date ?? "",
          notePersonne: evaluation.notePersonne,
          notePro: evaluation.notePro,
          noteStructure: evaluation.noteStructure,
          note: evaluation.note,
          fileUploads: {
            connect: (evaluation.fileUploads ?? []).map((fileUpload) => ({
              key: fileUpload.key,
            })),
          },
        },
      });
    })
  );
};
