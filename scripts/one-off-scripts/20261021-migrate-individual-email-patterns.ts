// One-off : transforme les patterns d'email individuels (commençant par "^") en binômes personnels.
// Idempotent : les patterns traités sont supprimés donc ne sont plus retraités.
//
// Usage : yarn one-off 20261021-migrate-individual-email-patterns [--dry-run]

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

const isDryRun = process.argv.includes("--dry-run");

const REGEX_METACHARACTERS = /[\^$*+?()[\]{}|\\]/;

const getEmailFromPattern = (pattern: string): string | null => {
  const email = pattern
    .replace(/^\^/, "")
    .replace(/\$$/, "")
    .replace(/\\(.)/g, "$1");
  if (REGEX_METACHARACTERS.test(email) || !/^[^\s@]+@[^\s@]+$/.test(email)) {
    return null;
  }
  return new RegExp(pattern, "i").test(email) ? email : null;
};

const migrateIndividualEmailPatterns = async () => {
  console.log(
    `➡️ Migration des patterns d'email individuels${isDryRun ? " (dry-run, aucune écriture)" : ""}`
  );

  const [emailPatterns, users] = await Promise.all([
    prisma.emailPattern.findMany({
      where: { pattern: { startsWith: "^" } },
      select: {
        id: true,
        pattern: true,
        grants: {
          select: {
            role: true,
            scope: true,
            regionId: true,
            departementNumero: true,
            structureId: true,
          },
        },
      },
      orderBy: { id: "asc" },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        emailPatternId: true,
        _count: { select: { grants: true } },
      },
    }),
  ]);

  const counts = { copied: 0, created: 0, deletedOnly: 0, skipped: 0 };

  for (const emailPattern of emailPatterns) {
    const regex = new RegExp(emailPattern.pattern, "i");
    const matchingUsers = users.filter(({ email }) => regex.test(email));
    const grantCount = emailPattern.grants.length;
    const label = `${emailPattern.pattern} (${grantCount} binôme(s))`;

    if (matchingUsers.length > 1) {
      console.warn(
        `⚠️ ${label} : ${matchingUsers.length} users correspondent, ignoré (${matchingUsers.map(({ email }) => email).join(", ")})`
      );
      counts.skipped++;
      continue;
    }

    const [user] = matchingUsers;

    if (user?.emailPatternId && user.emailPatternId !== emailPattern.id) {
      console.warn(
        `⚠️ ${label} : ${user.email} est rattaché à un autre pattern (id ${user.emailPatternId}), ignoré`
      );
      counts.skipped++;
      continue;
    }

    if (!user) {
      const email = getEmailFromPattern(emailPattern.pattern);
      if (!email) {
        console.warn(
          `⚠️ ${label} : aucun user et adresse non déductible du pattern, ignoré`
        );
        counts.skipped++;
        continue;
      }
      if (grantCount === 0) {
        console.log(
          `🗑️ ${label} : aucun user, aucun binôme → pattern supprimé`
        );
        counts.deletedOnly++;
      } else {
        console.log(
          `➕ ${label} : user ${email} créé avec les binômes du pattern → pattern supprimé`
        );
        counts.created++;
      }
      if (!isDryRun) {
        await prisma.$transaction(async (tx) => {
          if (grantCount > 0) {
            await tx.user.create({
              data: {
                email,
                grants: { createMany: { data: emailPattern.grants } },
              },
            });
          }
          await tx.emailPattern.delete({ where: { id: emailPattern.id } });
        });
      }
      continue;
    }

    const shouldCopyGrants = user._count.grants === 0 && grantCount > 0;
    if (shouldCopyGrants) {
      console.log(
        `📋 ${label} : binômes copiés sur ${user.email} → pattern supprimé`
      );
      counts.copied++;
    } else {
      console.log(
        `🗑️ ${label} : ${user.email} (${user._count.grants} binôme(s) personnel(s)) inchangé → pattern supprimé`
      );
      counts.deletedOnly++;
    }
    if (!isDryRun) {
      await prisma.$transaction(async (tx) => {
        if (shouldCopyGrants) {
          await tx.grant.createMany({
            data: emailPattern.grants.map((grant) => ({
              ...grant,
              userId: user.id,
            })),
          });
        }
        await tx.emailPattern.delete({ where: { id: emailPattern.id } });
      });
    }
  }

  console.log(
    `✅ ${emailPatterns.length} pattern(s) individuel(s) : ${counts.copied} copié(s) sur un user existant, ${counts.created} user(s) créé(s), ${counts.deletedOnly} supprimé(s) sans copie, ${counts.skipped} ignoré(s)`
  );
};

migrateIndividualEmailPatterns()
  .catch((error) => {
    console.error(
      "❌ Erreur pendant la migration des patterns individuels :",
      error
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
