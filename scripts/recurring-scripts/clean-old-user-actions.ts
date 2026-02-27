// Supprimer les UserAction de plus de 2 ans (RGPD)
// Usage: yarn script clean-old-user-actions

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

const run = async () => {
  try {
    console.log("🗑️ Suppression des actions utilisateur de plus de 2 ans");

    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const deleted = await prisma.userAction.deleteMany({
      where: {
        createdAt: {
          lt: twoYearsAgo,
        },
      },
    });
    console.log(`Suppression de ${deleted.count} UserActions de plus de 2 ans`);
  } catch (error) {
    console.error(
      "❌ Erreur lors de la suppression des actions utilisateur de plus de 2 ans",
      error
    );
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

run();
