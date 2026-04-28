// One-off script: migrate legacy Structure.notes into Note rows
// Usage: yarn one-off 20260410-migrate-structure-notes-to-note

import "dotenv/config";

import { NoteType } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";
import { BHASILE_USER_NAME } from "@/constants";

const prisma = createPrismaClient();

const BHASILE_CONTACT_EMAIL = process.env.BHASILE_CONTACT_EMAIL || "";
if (BHASILE_CONTACT_EMAIL === "") {
  throw new Error("BHASILE_CONTACT_EMAIL is not set");
}

async function main() {
  console.log(":robot: Upsert fake user...");
  const bhasile = await prisma.user.upsert({
    where: { email: BHASILE_CONTACT_EMAIL },
    update: {
      name: BHASILE_USER_NAME,
      lastConnection: new Date(),
    },
    create: {
      name: BHASILE_USER_NAME,
      email: BHASILE_CONTACT_EMAIL,
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
    select: { id: true, codeBhasile: true, notes: true, createdAt: true },
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

  for (const structure of targets) {
    try {
      const existing = await prisma.note.findFirst({
        where: {
          structureId: structure.id,
          userId: bhasile.id,
          text: structure.note,
        },
        select: { id: true },
      });

      if (existing) {
        skipped += 1;
        continue;
      }

      await prisma.note.create({
        data: {
          structure: { connect: { id: structure.id } },
          user: { connect: { id: bhasile.id } },
          noteType: NoteType.GENERAL,
          text: structure.note,
          isArchived: false,
          createdAt: structure.createdAt,
          updatedAt: structure.createdAt,
        },
        select: { id: true },
      });

      created += 1;
    } catch (error) {
      errors += 1;
      console.error(
        `❌ Structure id=${structure.id} codeBhasile=${structure.codeBhasile ?? "?"}:`,
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
