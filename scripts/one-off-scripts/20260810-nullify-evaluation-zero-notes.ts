// One-off : une note d'évaluation à 0 est toujours une non-saisie, jamais une vraie note.
// Les sous-notes à 0 repassent à null, et la note générale à 0 est recalculée
// comme la moyenne des 3 sous-notes quand elles sont toutes renseignées.
//
// Usage : yarn one-off 20260810-nullify-evaluation-zero-notes

import "dotenv/config";

import { roundTo } from "@/app/utils/math.util";
import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

async function main() {
  console.log("🚀 Nettoyage des notes d'évaluation à 0…");

  const notePersonne = await prisma.evaluation.updateMany({
    where: { notePersonne: 0 },
    data: { notePersonne: null },
  });
  const notePro = await prisma.evaluation.updateMany({
    where: { notePro: 0 },
    data: { notePro: null },
  });
  const noteStructure = await prisma.evaluation.updateMany({
    where: { noteStructure: 0 },
    data: { noteStructure: null },
  });

  console.log(
    `✅ Sous-notes repassées à null : ${notePersonne.count} notePersonne, ${notePro.count} notePro, ${noteStructure.count} noteStructure.`
  );

  const evaluations = await prisma.evaluation.findMany({
    where: { note: 0 },
    select: {
      id: true,
      notePersonne: true,
      notePro: true,
      noteStructure: true,
    },
    orderBy: { id: "asc" },
  });

  let recomputed = 0;
  let nullified = 0;
  let errors = 0;

  for (const evaluation of evaluations) {
    const note = getAverageNote(evaluation);
    try {
      await prisma.evaluation.update({
        where: { id: evaluation.id },
        data: { note },
      });
      if (note === null) {
        nullified += 1;
      } else {
        recomputed += 1;
      }
    } catch (error) {
      errors += 1;
      console.error(`❌ Evaluation id=${evaluation.id}:`, error);
    }
  }

  console.log(
    `✅ Note générale : ${recomputed} recalculée(s) depuis les sous-notes, ${nullified} repassée(s) à null${errors ? `, ${errors} erreur(s)` : ""}.`
  );
}

const getAverageNote = ({
  notePersonne,
  notePro,
  noteStructure,
}: {
  notePersonne: number | null;
  notePro: number | null;
  noteStructure: number | null;
}): number | null => {
  if (notePersonne === null || notePro === null || noteStructure === null) {
    return null;
  }
  return roundTo((notePersonne + notePro + noteStructure) / 3, 2);
};

main()
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
