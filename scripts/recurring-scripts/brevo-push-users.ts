// Pousse les utilisateurs dans la liste Brevo
// Usage: yarn script brevo-push-users

import "dotenv/config";

import { pushContactsToBrevo, toBrevoContact } from "scripts/utils/brevo.util";

import { grantSelect, perimeterSelect } from "@/app/api/users/user.db.type";
import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

const run = async () => {
  try {
    const users = await prisma.user.findMany({
      where: {
        isActivated: true,
        operateurId: null,
        perimeterId: { not: null },
      },
      select: {
        email: true,
        lastConnection: true,
        createdAt: true,
        isActivated: true,
        operateurId: true,
        perimeter: { select: perimeterSelect },
        grants: { select: grantSelect },
      },
    });

    console.log(`👥 ${users.length} agents à synchroniser vers Brevo`);

    await pushContactsToBrevo(users.map(toBrevoContact));
  } catch (error) {
    console.error(
      "❌ Erreur lors de la synchronisation des agents vers Brevo",
      error
    );
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

run();
