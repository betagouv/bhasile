// One-off : rattachement des structures existantes à leur arrondissement.
// Prérequis : le référentiel doit être chargé (20260807-load-arrondissements-referentiel).
// Rejouable : ne touche que les structures dont l'arrondissement est encore vide.
// Usage : yarn one-off 20260807-backfill-structure-arrondissement

import "dotenv/config";

import { resolveArrondissementCode } from "@/app/api/communes/commune.service";
import { currentVersionArgs } from "@/app/api/structure-versions/structure-version.db.type";
import { getNow } from "@/app/utils/now.util";
import prisma from "@/lib/prisma";

const structures = await prisma.structure.findMany({
  where: { arrondissementCode: null },
  select: {
    id: true,
    codeBhasile: true,
    structureVersions: {
      ...currentVersionArgs(getNow()),
      select: { codePostalAdministratif: true, communeAdministrative: true },
    },
  },
});

console.log(`➡️ ${structures.length} structures à rattacher...`);

const unresolved: string[] = [];
let resolvedCount = 0;

for (const structure of structures) {
  const version = structure.structureVersions[0];
  const arrondissementCode = await resolveArrondissementCode(
    version?.codePostalAdministratif,
    version?.communeAdministrative
  );

  if (!arrondissementCode) {
    unresolved.push(
      `${structure.codeBhasile} (${version?.codePostalAdministratif ?? "sans code postal"} ${version?.communeAdministrative ?? "sans commune"})`
    );
    continue;
  }

  await prisma.structure.update({
    where: { id: structure.id },
    data: { arrondissementCode },
  });
  resolvedCount += 1;
}

console.log(`✅ ${resolvedCount} structures rattachées.`);

if (unresolved.length > 0) {
  console.log(`⚠️ ${unresolved.length} non résolues, à traiter à la main :`);
  unresolved.forEach((label) => console.log(`   - ${label}`));
}

await prisma.$disconnect();
