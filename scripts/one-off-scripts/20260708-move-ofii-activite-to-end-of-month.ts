// One-off script: déplace la date des Activite OFII du 1er du mois vers le dernier jour du mois (même horaire UTC).
// Usage: yarn one-off 20260708-move-ofii-activite-to-end-of-month

import "dotenv/config";

import { endOfMonthUtcFromDate } from "@/app/utils/date.util";
import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

async function main() {
  console.log(
    "🚀 Déplacement des dates d'activité OFII vers le dernier jour du mois..."
  );

  const activites = await prisma.activite.findMany({
    select: { id: true, date: true },
    orderBy: { id: "asc" },
  });

  let updated = 0;
  let unchanged = 0;
  let errors = 0;

  for (const activite of activites) {
    const newDate = endOfMonthUtcFromDate(activite.date);
    if (newDate.getTime() === activite.date.getTime()) {
      unchanged += 1;
      continue;
    }
    try {
      await prisma.activite.update({
        where: { id: activite.id },
        data: { date: newDate },
      });
      updated += 1;
    } catch (error) {
      errors += 1;
      console.error(`❌ Activite id=${activite.id}:`, error);
    }
  }

  console.log(
    `✅ Activite: ${updated} déplacées, ${unchanged} déjà en fin de mois${errors ? `, ${errors} erreurs` : ""} (sur ${activites.length}).`
  );
  console.log("Terminé.");
}

main()
  .catch((error) => {
    console.error(
      "❌ Erreur pendant le déplacement des dates d'activité :",
      error
    );
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
