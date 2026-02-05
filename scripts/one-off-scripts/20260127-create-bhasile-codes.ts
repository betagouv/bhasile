// Script de one-off pour remplir les codes Bhasile dans la table Structure
// et propager le codeBhasile dans toutes les tables qui référencent la structure via dnaCode.
// En premier remplissage, 1 code DNA -> 1 code Bhasile.
// Usage: yarn one-off 20260127-create-bhasile-codes

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";
import {
  generateBhasileCode,
  REGION_CODES,
} from "@/app/utils/bhasileCode.util";

const prisma = createPrismaClient();

async function main() {
  console.log("🚀 Début du remplissage des codes Bhasile…");

  const structures = await prisma.structure.findMany({
    select: {
      id: true,
      dnaCode: true,
      codeBhasile: true,
      departementAdministratif: true,
      departement: {
        select: {
          region: true,
        },
      },
    },
  });

  console.log(`📊 ${structures.length} structures trouvées`);

  let updatedCount = 0;

  for (const structure of structures) {
    if (structure.codeBhasile) {
      continue;
    }

    const regionName = structure.departement?.region;
    const regionKey = regionName as keyof typeof REGION_CODES;
    const codeBhasile = await generateBhasileCode(regionKey);

    await prisma.$transaction(async (tx) => {
      // 1. Create Bhasile code for structure
      await tx.structure.update({
        where: { id: structure.id },
        data: { codeBhasile },
      });

      // 2. Link Structure with Dna table
      const dna =
        (await tx.dna.findUnique({ where: { code: structure.dnaCode } })) ??
        (await tx.dna.create({
          data: {
            code: structure.dnaCode,
            granularity: null,
          },
        }));

      const existingDnaLink = await tx.dnaStructure.findFirst({
        where: {
          dnaId: dna.id,
          structureId: structure.id,
        },
      });

      if (!existingDnaLink) {
        await tx.dnaStructure.create({
          data: {
            dnaId: dna.id,
            structureId: structure.id,
            startDate: null,
            endDate: null,
          },
        });
      }

      // 3. Update structureId on all child tables
      await tx.controle.updateMany({
        where: { structureDnaCode: structure.dnaCode },
        data: { structureId: structure.id },
      });

      await tx.evaluation.updateMany({
        where: { structureDnaCode: structure.dnaCode },
        data: { structureId: structure.id },
      });

      await tx.adresse.updateMany({
        where: { structureDnaCode: structure.dnaCode },
        data: { structureId: structure.id },
      });

      await tx.contact.updateMany({
        where: { structureDnaCode: structure.dnaCode },
        data: { structureId: structure.id },
      });

      await tx.structureMillesime.updateMany({
        where: { structureDnaCode: structure.dnaCode },
        data: { structureId: structure.id },
      });

      await tx.structureTypologie.updateMany({
        where: { structureDnaCode: structure.dnaCode },
        data: { structureId: structure.id },
      });

      await tx.fileUpload.updateMany({
        where: { structureDnaCode: structure.dnaCode },
        data: { structureId: structure.id },
      });

      await tx.budget.updateMany({
        where: { structureDnaCode: structure.dnaCode },
        data: { structureId: structure.id },
      });

      await tx.form.updateMany({
        where: { structureCodeDna: structure.dnaCode },
        data: { structureId: structure.id },
      });

      await tx.campaign.updateMany({
        where: { structureCodeDna: structure.dnaCode },
        data: { structureId: structure.id },
      });
    });

    updatedCount++;
  }

  console.log(
    `✅ Remplissage terminé : ${updatedCount} structures mises à jour`
  );
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du remplissage des codes Bhasile :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
