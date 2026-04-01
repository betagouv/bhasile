// @ts-nocheck
// One-off script: backfill dnaCode from structureDnaCode for Activite and EIG.
// Usage: yarn one-off 20260323-link-dna-for-activite-and-eig

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

async function backfillEigs() {
  const eigs = await prisma.evenementIndesirableGrave.findMany({
    where: {
      structureDnaCode: { not: null },
      dnaCode: null,
    },
    select: {
      id: true,
      structureDnaCode: true,
    },
  });

  let updated = 0;
  for (const eig of eigs) {
    const code = eig.structureDnaCode?.trim();
    if (!code) continue;

    await prisma.evenementIndesirableGrave.update({
      where: { id: eig.id },
      data: { dnaCode: code },
    });
    updated++;
  }

  return { scanned: eigs.length, updated };
}

async function backfillActivites() {
  const activites = await prisma.activite.findMany({
    where: {
      structureDnaCode: { not: null },
      dnaCode: null,
    },
    select: {
      id: true,
      date: true,
      structureDnaCode: true,
    },
    orderBy: { id: "asc" },
  });

  let updated = 0;
  let conflicts = 0;

  for (const activite of activites) {
    const code = activite.structureDnaCode?.trim();
    if (!code) continue;

    // Avoid violating @@unique([dnaCode, date]) during backfill.
    const duplicate = await prisma.activite.findFirst({
      where: {
        id: { not: activite.id },
        dnaCode: code,
        date: activite.date,
      },
      select: { id: true },
    });

    if (duplicate) {
      conflicts++;
      console.warn(
        `⚠️ Activite id=${activite.id} ignorée (conflit unique dnaCode/date avec id=${duplicate.id})`
      );
      continue;
    }

    await prisma.activite.update({
      where: { id: activite.id },
      data: { dnaCode: code },
    });
    updated++;
  }

  return { scanned: activites.length, updated, conflicts };
}

async function main() {
  console.log("🚀 Début du backfill dnaCode pour Activite et EIG...");

  const eig = await backfillEigs();
  console.log(`✅ EIG: ${eig.updated}/${eig.scanned} lignes mises à jour`);

  const activite = await backfillActivites();
  console.log(
    `✅ Activite: ${activite.updated}/${activite.scanned} lignes mises à jour (${activite.conflicts} conflits)`
  );
}

main()
  .catch((error) => {
    console.error(
      "❌ Erreur pendant le backfill dnaCode Activite/EIG :",
      error
    );
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
