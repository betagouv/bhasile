// One-off : repart du document d'accès (export Tally) pour rattacher chaque agent à son périmètre.
// Rien n'est supprimé : les agents absents du document sont désactivés, binômes conservés.
// Le script s'arrête avant toute écriture si le document ou la base est incohérent.
//
// Usage : yarn one-off 20261104-reset-agents <fichier.csv> [--dry-run]

import "dotenv/config";

import {
  AgentsResetPlan,
  DocumentPerimeter,
  findEmailCaseDuplicates,
  getMissingColumns,
  parseAgentsDocument,
  PerimetersPlan,
  planAgentsReset,
  planPerimeters,
} from "scripts/utils/agents-reset.util";
import { loadCsvFromS3 } from "scripts/utils/csv-loader";

import { grantSelect } from "@/app/api/users/user.db.type";
import { normalizeEmail } from "@/app/api/users/user.util";
import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const csvFilename = args.find((arg) => !arg.startsWith("--"));

const TRANSACTION_TIMEOUT_MS = 120_000;

const resetAgents = async () => {
  if (!csvFilename) {
    throw new Error("Nom du fichier CSV manquant");
  }
  console.log(
    `➡️ Reprise des agents depuis ${csvFilename}${isDryRun ? " (dry-run, aucune écriture)" : ""}`
  );

  const rows = await loadCsvFromS3<Record<string, string>>(
    process.env.DOCS_BUCKET_NAME!,
    csvFilename
  );
  if (rows.length === 0) {
    throw new Error("Document vide");
  }
  const missingColumns = getMissingColumns(Object.keys(rows[0]));
  if (missingColumns.length > 0) {
    throw new Error(`Colonnes absentes : ${missingColumns.join(" | ")}`);
  }

  const [regions, departements, existingPerimeters, users] = await Promise.all([
    prisma.region.findMany({ select: { id: true, name: true } }),
    prisma.departement.findMany({ select: { numero: true, name: true } }),
    prisma.perimeter.findMany({
      select: {
        name: true,
        scope: true,
        regionId: true,
        departementNumero: true,
      },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        isSuperAdmin: true,
        isAgent: true,
        operateurId: true,
        isActivated: true,
        deactivatedAt: true,
        lastConnection: true,
        perimeter: { select: { name: true } },
        grants: { select: grantSelect },
        emailPattern: {
          select: { isAgent: true, grants: { select: grantSelect } },
        },
      },
      orderBy: { email: "asc" },
    }),
  ]);

  const { perimeters, errors } = parseAgentsDocument(rows, {
    regions,
    departements,
  });
  const caseDuplicates = findEmailCaseDuplicates(users).map(
    (emails) => `doublon de casse en base : ${emails.join(", ")}`
  );
  const plan = planAgentsReset(perimeters, users);
  const blockingErrors = [...errors, ...caseDuplicates, ...plan.errors];

  if (blockingErrors.length > 0) {
    console.error(`❌ ${blockingErrors.length} erreur(s), aucune écriture :`);
    blockingErrors.forEach((error) => console.error(`  - ${error}`));
    process.exitCode = 1;
    return;
  }

  const perimetersPlan = planPerimeters(perimeters, existingPerimeters);
  const emailsToNormalize = users.filter(
    ({ email }) => email !== normalizeEmail(email)
  );
  logPlan(plan, perimetersPlan, emailsToNormalize.length);

  if (isDryRun) {
    console.log("🧪 Dry-run : aucune écriture");
    return;
  }

  await applyPlan(plan, perimeters, emailsToNormalize);
  console.log("✅ Reprise terminée");
};

const applyPlan = async (
  plan: AgentsResetPlan,
  perimeters: DocumentPerimeter[],
  emailsToNormalize: { id: number; email: string }[]
) => {
  const now = new Date();
  await prisma.$transaction(
    async (tx) => {
      const perimeterIds = new Map<string, number>();
      for (const { name, zone } of perimeters) {
        const data = {
          scope: zone.scope,
          regionId: zone.regionId,
          departementNumero: zone.departementNumero,
        };
        const { id } = await tx.perimeter.upsert({
          where: { name },
          create: { name, ...data },
          update: data,
          select: { id: true },
        });
        perimeterIds.set(name, id);
      }

      for (const { email, perimeter, user } of plan.agents) {
        const data = {
          email,
          perimeterId: perimeterIds.get(perimeter.name)!,
          isActivated: true,
          deactivatedAt: null,
        };
        if (user) {
          await tx.user.update({ where: { id: user.id }, data });
        } else {
          await tx.user.create({ data });
        }
      }

      for (const { id } of plan.superAdmins) {
        await tx.user.update({
          where: { id },
          data: { isActivated: true, deactivatedAt: null },
        });
      }

      for (const { user } of plan.deactivated) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            isActivated: false,
            deactivatedAt: user.deactivatedAt ?? now,
          },
        });
      }

      const agentIds = new Set(plan.agents.map(({ user }) => user?.id));
      for (const { id, email } of emailsToNormalize) {
        if (!agentIds.has(id)) {
          await tx.user.update({
            where: { id },
            data: { email: normalizeEmail(email) },
          });
        }
      }
    },
    { timeout: TRANSACTION_TIMEOUT_MS }
  );
};

const logPlan = (
  plan: AgentsResetPlan,
  perimetersPlan: PerimetersPlan,
  emailsToNormalizeCount: number
) => {
  if (plan.warnings.length > 0) {
    console.warn(`⚠️ ${plan.warnings.length} avertissement(s) :`);
    plan.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  console.log(
    `\n🗺️ Périmètres : ${perimetersPlan.created.length} créé(s), ${perimetersPlan.zoneChanged.length} zone modifiée, ${perimetersPlan.unchanged.length} inchangé(s), ${perimetersPlan.absent.length} absent(s) du document (conservés)`
  );
  perimetersPlan.created.forEach(({ name, zone }) =>
    console.log(`  ➕ ${name} (${zone.label})`)
  );
  perimetersPlan.zoneChanged.forEach(({ name, zone }) =>
    console.log(`  ✏️ ${name} → ${zone.label}`)
  );
  perimetersPlan.absent.forEach((name) => console.log(`  ⏸️ ${name}`));

  const created = plan.agents.filter(({ status }) => status === "CREATED");
  const same = plan.agents.filter(({ status }) => status === "SAME_RIGHTS");
  const different = plan.agents.filter(
    ({ status }) => status === "DIFFERENT_RIGHTS"
  );

  console.log(
    `\n👥 Agents du document : ${plan.agents.length} (rôle éditeur actuel comparé à la zone du périmètre, futur rôle admin)`
  );
  console.log(`\n➕ ${created.length} nouveau(x) compte(s) :`);
  created.forEach(({ email, perimeter }) =>
    console.log(`  - ${email} → ${perimeter.name} (${perimeter.zone.label})`)
  );
  console.log(`\n🟰 ${same.length} existant(s), même zone :`);
  same.forEach(({ email, perimeter }) =>
    console.log(`  - ${email} → ${perimeter.name}`)
  );
  console.log(`\n🔀 ${different.length} existant(s), droits différents :`);
  different.forEach(({ email, perimeter, rightsBefore, rightsAfter }) =>
    console.log(
      `  - ${email} → ${perimeter.name}\n      avant : ${rightsBefore}\n      après : ${rightsAfter}`
    )
  );

  console.log(
    `\n⛔ ${plan.deactivated.length} agent(s) absent(s) du document, désactivé(s), binômes conservés :`
  );
  plan.deactivated.forEach(({ user, rights, isNational }) =>
    console.log(
      `  - ${isNational ? "[NATIONAL] " : ""}${user.email} : ${rights} (dernière connexion : ${user.lastConnection?.toISOString() ?? "jamais"}${user.deactivatedAt ? `, déjà désactivé le ${user.deactivatedAt.toISOString()}` : ""})`
    )
  );

  console.log(
    `\n🛡️ ${plan.superAdmins.length} superadmin(s), activé(s) et inchangé(s) :`
  );
  plan.superAdmins.forEach(({ email }) => console.log(`  - ${email}`));

  if (plan.operateurUsers.length > 0) {
    console.log(
      `\n🏢 ${plan.operateurUsers.length} user(s) opérateur, inchangé(s) :`
    );
    plan.operateurUsers.forEach(({ email }) => console.log(`  - ${email}`));
  }

  console.log(`\n💤 ${plan.pendingCount} user(s) sans accès, jamais activé(s)`);
  console.log(`🔡 ${emailsToNormalizeCount} email(s) passé(s) en minuscules\n`);
};

resetAgents()
  .catch((error) => {
    console.error("❌ Erreur pendant la reprise des agents :", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
