// One-off script: migrate legacy Structure.notes into Note rows
// Usage: yarn one-off 20260410-migrate-structure-notes-to-note

import "dotenv/config";

import { NoteType } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

const BHASILE_EMAIL = "bhasile@bhasile.fr";
const BHASILE_NAME = "Bhasile";

async function main() {
  console.log(":robot: Upsert fake user...");
  const bhasile = await prisma.user.upsert({
    where: { email: BHASILE_EMAIL },
    update: {
      name: BHASILE_NAME,
      lastConnection: new Date(),
    },
    create: {
      name: BHASILE_NAME,
      email: BHASILE_EMAIL,
      lastConnection: new Date(),
    },
    select: { id: true, email: true },
  });
  console.log("✓ Fake user créé");

  console.log("📥 Récupération des structures avec legacy notes...");
  const structures = await prisma.structure.findMany({
    where: {
      notes: { not: null },
    },
    select: { id: true, codeBhasile: true, notes: true },
  });

  const targets = structures
    .map((s) => {
      const note = s.notes ?? "";
      return { ...s, note };
    })
    .filter((s) => s.note.length > 0);

  console.log(
    `✓ ${targets.length} structures à migrer (sur ${structures.length})`
  );

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const s of targets) {
    try {
      const existing = await prisma.note.findFirst({
        where: {
          structureId: s.id,
          userId: bhasile.id,
          note: s.note,
        },
        select: { id: true },
      });

      if (existing) {
        skipped += 1;
        continue;
      }

      await prisma.note.create({
        data: {
          structure: { connect: { id: s.id } },
          user: { connect: { id: bhasile.id } },
          noteType: NoteType.GENERAL,
          note: s.note,
          isArchived: false,
        },
        select: { id: true },
      });

      created += 1;
    } catch (error) {
      errors += 1;
      console.error(
        `❌ Structure id=${s.id} codeBhasile=${s.codeBhasile ?? "?"}:`,
        error
      );
    }
  }

  console.log(
    `✅ Terminé: ${created} notes créées, ${skipped} déjà existantes, ${errors} erreurs.`
  );
}

main()
  .catch((error) => {
    console.error("❌ Erreur pendant la migration des notes :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
