// One-off: recale les dates des RMU au dernier jour du mois (midi UTC), pour
// Usage: yarn one-off 20260709-realign-rmu-dates-to-month-end

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

function toMonthEndNoonUTC(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12)
  );
}

function sameInstant(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

async function main() {
  console.log("🚀 Recalage des dates RMU au dernier jour du mois...");

  const rmus = await prisma.rmu.findMany({
    select: { id: true, departementNumero: true, date: true },
    orderBy: { id: "asc" },
  });
  type RmuRow = (typeof rmus)[number];
  console.log(`📥 ${rmus.length} ligne(s) RMU chargée(s).`);

  // Regroupe par (département, dernier jour du mois cible).
  const groups = new Map<string, RmuRow[]>();
  for (const rmu of rmus) {
    const target = toMonthEndNoonUTC(rmu.date);
    const key = `${rmu.departementNumero}|${target.toISOString()}`;
    const group = groups.get(key);
    if (group) {
      group.push(rmu);
    } else {
      groups.set(key, [rmu]);
    }
  }

  let migrated = 0;
  let notMigrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const group of groups.values()) {
    const target = toMonthEndNoonUTC(group[0].date);

    // Ligne déjà au dernier jour du mois (créneau occupé).
    const occupant = group.find((row) => sameInstant(row.date, target));
    const candidates = group.filter((row) => !sameInstant(row.date, target));

    if (candidates.length === 0) {
      skipped += 1;
      continue;
    }

    // Créneau déjà occupé, ou plusieurs prétendants pour le même mois
    if (occupant !== undefined || candidates.length > 1) {
      for (const row of candidates) {
        const reason =
          occupant !== undefined
            ? `créneau déjà occupé par la RMU id=${occupant.id}`
            : "plusieurs lignes pour ce mois";
        console.warn(
          `⚠️ Non migré : RMU id=${row.id} dept=${row.departementNumero} ${row.date.toISOString().slice(0, 10)} → ${target.toISOString().slice(0, 10)} (${reason})`
        );
      }
      notMigrated += candidates.length;
      continue;
    }

    // Créneau libre et une seule ligne à déplacer
    const [row] = candidates;
    try {
      await prisma.rmu.update({
        where: { id: row.id },
        data: { date: target },
      });
      migrated += 1;
    } catch (error) {
      errors += 1;
      console.error(
        `❌ Échec RMU id=${row.id} dept=${row.departementNumero} ${row.date.toISOString().slice(0, 10)} :`,
        error
      );
    }
  }

  console.log(
    `✅ Terminé : ${migrated} ligne(s) recalée(s), ${notMigrated} non migrée(s) (conflit), ${skipped} déjà au dernier jour, ${errors} erreur(s).`
  );
}

main()
  .catch((error) => {
    console.error("❌ Erreur pendant le recalage des dates RMU :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
