// One-off à lancer juste après le déploiement de la bascule vers les périmètres :
// - supprime les binômes sans user ni périmètre (anciens email patterns) et ceux des agents ;
// - passe en minuscules, sans espaces, les emails des users et des contacts, désormais comparés tels quels.
// Idempotent.
//
// Usage : yarn one-off 20261104-clean-grants-and-emails [--dry-run]

import "dotenv/config";

import { findEmailCaseDuplicates } from "scripts/utils/agents-reset.util";

import { normalizeEmail } from "@/app/api/users/user.util";
import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

const isDryRun = process.argv.includes("--dry-run");

const TRANSACTION_TIMEOUT_MS = 120_000;

const orphanGrantWhere = { userId: null, perimeterId: null };
const agentGrantWhere = { user: { operateurId: null } };

const cleanGrantsAndEmails = async () => {
  console.log(
    `➡️ Nettoyage des binômes et des emails${isDryRun ? " (dry-run, aucune écriture)" : ""}`
  );

  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });
  const duplicates = findEmailCaseDuplicates(users);
  if (duplicates.length > 0) {
    console.error(
      "❌ Users en double à la casse près, à fusionner à la main :"
    );
    duplicates.forEach((emails) => console.error(`  - ${emails.join(", ")}`));
    process.exitCode = 1;
    return;
  }
  const usersToNormalize = users.filter(
    ({ email }) => email !== normalizeEmail(email)
  );

  const contacts = await prisma.contact.findMany({
    where: { email: { not: null } },
    select: { id: true, email: true },
  });
  const contactIdsByEmail = new Map<string, number[]>();
  for (const { id, email } of contacts) {
    const normalizedEmail = normalizeEmail(email!);
    if (email !== normalizedEmail) {
      contactIdsByEmail.set(normalizedEmail, [
        ...(contactIdsByEmail.get(normalizedEmail) ?? []),
        id,
      ]);
    }
  }

  const [orphanGrantCount, agentGrantCount] = await Promise.all([
    prisma.grant.count({ where: orphanGrantWhere }),
    prisma.grant.count({ where: agentGrantWhere }),
  ]);

  const verb = isDryRun ? "à supprimer" : "supprimé(s)";
  console.log(`  • ${orphanGrantCount} binôme(s) sans propriétaire ${verb}`);
  console.log(`  • ${agentGrantCount} binôme(s) d'agents ${verb}`);
  console.log(
    `  • ${usersToNormalize.length} email(s) de users ${isDryRun ? "à normaliser" : "normalisé(s)"}`
  );
  usersToNormalize.forEach(({ email }) => console.log(`    - ${email}`));
  console.log(
    `  • ${[...contactIdsByEmail.values()].flat().length} email(s) de contacts ${isDryRun ? "à normaliser" : "normalisé(s)"}`
  );

  if (isDryRun) {
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.grant.deleteMany({
        where: { OR: [orphanGrantWhere, agentGrantWhere] },
      });
      for (const { id, email } of usersToNormalize) {
        await tx.user.update({
          where: { id },
          data: { email: normalizeEmail(email) },
        });
      }
      for (const [email, ids] of contactIdsByEmail) {
        await tx.contact.updateMany({
          where: { id: { in: ids } },
          data: { email },
        });
      }
    },
    { timeout: TRANSACTION_TIMEOUT_MS }
  );

  console.log("✅ Nettoyage terminé");
};

cleanGrantsAndEmails()
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
