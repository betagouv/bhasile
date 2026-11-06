// One-off : marque comme agents les patterns d'email et les utilisateurs à binômes personnels existants.
// Avant ce script, la base ne contient que des agents.
// Une seule exécution utile : dès qu'un pattern est agent, le script ne fait plus rien,
// pour ne jamais basculer en agent un pattern ou un utilisateur créé après.
//
// Usage : yarn one-off 20261027-mark-existing-agents

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

const markExistingAgents = async () => {
  const agentPatternCount = await prisma.emailPattern.count({
    where: { isAgent: true },
  });
  if (agentPatternCount > 0) {
    console.log("⏭️ Agents déjà marqués, rien à faire.");
    return;
  }

  const [emailPatterns, users] = await prisma.$transaction([
    prisma.emailPattern.updateMany({ data: { isAgent: true } }),
    prisma.user.updateMany({
      where: { isAgent: null, operateurId: null, grants: { some: {} } },
      data: { isAgent: true },
    }),
  ]);

  console.log(
    `✅ ${emailPatterns.count} pattern(s) d'email et ${users.count} utilisateur(s) à binômes personnels marqués agents.`
  );
};

markExistingAgents()
  .catch((error) => {
    console.error("❌ Erreur pendant le marquage des agents :", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
