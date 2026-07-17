// Ouvre la campagne d'actualisation de l'année : crée les templates (CampaignDefinition
// "Actualisation <année>" + FormDefinition actualisation) puis matérialise, par structure
// éligible (finalisée et non fermée), une campagne + une StructureVersion (effectiveDate = maintenant).
// L'année vient de l'argument CLI (sinon ACTUALISATION_YEAR), la deadline du 2e argument (YYYY-MM-DD). No-op hors période.
// One-shot idempotent : re-jouable pour recovery (les structures ayant déjà une campagne sont sautées).
// Usage : yarn script create-actualisation-campaigns <année> <deadline YYYY-MM-DD>

import "dotenv/config";

import { pathToFileURL } from "node:url";

import { actualisationCampaignDefinitionSlug } from "@/app/api/campaigns/campaign.constants";
import {
  ACTUALISATION_FORM_SLUG,
  ACTUALISATION_FORM_STEP_SLUGS,
} from "@/app/api/forms/form.constants";
import { createOrUpdateStructureVersion } from "@/app/api/structure-versions/structure-version.repository";
import { copyStructureVersion } from "@/app/api/structure-versions/structure-version.service";
import { resolveCurrentVersion } from "@/app/api/structure-versions/structure-version.util";
import { StructureDbDetails } from "@/app/api/structures/structure.db.type";
import { getResolvedStructure } from "@/app/api/structures/structure.service";
import {
  isBornFromCreation,
  isFinalisationFormValidated,
} from "@/app/api/structures/structure.util";
import { StructureVersionTransformationType } from "@/generated/prisma/enums";
import apiPrisma from "@/lib/prisma";
import { createPrismaClient } from "@/prisma-client";
import { StepStatus } from "@/types/form.type";

const prisma = createPrismaClient();

type ActualisationPrismaClient = typeof prisma;

export const createActualisationCampaignShell = async (
  client: ActualisationPrismaClient,
  input: {
    structure: StructureDbDetails;
    campaignDefinitionId: number;
    formDefinitionId: number;
    effectiveDate: Date;
  }
): Promise<void> => {
  await client.$transaction(async (tx) => {
    const campaign = await tx.campaign.create({
      data: { campaignDefinitionId: input.campaignDefinitionId },
    });
    const version = copyStructureVersion(input.structure, {
      effectiveDate: input.effectiveDate.toISOString(),
    });
    await createOrUpdateStructureVersion(tx, version, {
      structureId: input.structure.id,
      campaignId: campaign.id,
    });
    const form = await tx.form.create({
      data: {
        campaignId: campaign.id,
        formDefinitionId: input.formDefinitionId,
        status: false,
      },
    });
    const stepsDefinition = await tx.formStepDefinition.findMany({
      where: { formDefinitionId: input.formDefinitionId },
    });
    await tx.formStep.createMany({
      data: stepsDefinition.map((stepDefinition) => ({
        formId: form.id,
        stepDefinitionId: stepDefinition.id,
        status: StepStatus.NON_COMMENCE,
      })),
    });
  });
};

const parseDeadline = (value: string | undefined): Date | null => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const deadline = new Date(value);
  return Number.isNaN(deadline.getTime()) ? null : deadline;
};

const run = async () => {
  try {
    const actualisationYear = Number(
      process.argv[2] ?? process.env.ACTUALISATION_YEAR
    );

    if (!Number.isInteger(actualisationYear)) {
      console.log(
        "⏭️ Aucune année d'actualisation valide (arg ou ACTUALISATION_YEAR) — rien à créer."
      );
      return;
    }

    const deadline = parseDeadline(process.argv[3]);
    if (!deadline) {
      console.log(
        "⏭️ Deadline manquante ou invalide (2e argument attendu au format YYYY-MM-DD) — rien à créer."
      );
      return;
    }

    const campaignDefinition = await prisma.campaignDefinition.upsert({
      where: { slug: actualisationCampaignDefinitionSlug(actualisationYear) },
      update: { deadline },
      create: {
        slug: actualisationCampaignDefinitionSlug(actualisationYear),
        name: `Actualisation ${actualisationYear}`,
        version: 1,
        deadline,
      },
    });

    const formDefinition = await prisma.formDefinition.upsert({
      where: { slug: ACTUALISATION_FORM_SLUG },
      update: {},
      create: {
        slug: ACTUALISATION_FORM_SLUG,
        name: "actualisation",
        version: 1,
      },
    });

    for (const stepSlug of ACTUALISATION_FORM_STEP_SLUGS) {
      await prisma.formStepDefinition.upsert({
        where: {
          formDefinitionId_slug: {
            formDefinitionId: formDefinition.id,
            slug: stepSlug,
          },
        },
        update: {},
        create: {
          formDefinitionId: formDefinition.id,
          label: stepSlug,
          slug: stepSlug,
        },
      });
    }

    const now = new Date();

    const structures = await prisma.structure.findMany({
      include: {
        forms: { include: { formDefinition: { select: { slug: true } } } },
        structureVersions: {
          include: {
            structureVersionTransformation: {
              include: {
                transformation: {
                  include: { form: { select: { status: true } } },
                },
              },
            },
            campaign: { include: { form: { select: { status: true } } } },
          },
        },
      },
    });

    const existingCampaigns = await prisma.campaign.findMany({
      where: { campaignDefinitionId: campaignDefinition.id },
      select: { structureVersion: { select: { structureId: true } } },
    });
    const structureIdsWithCampaign = new Set(
      existingCampaigns
        .map((campaign) => campaign.structureVersion?.structureId)
        .filter((structureId): structureId is number => structureId != null)
    );

    let createdCount = 0;
    for (const structure of structures) {
      if (structureIdsWithCampaign.has(structure.id)) {
        continue;
      }

      const isFinalised =
        isBornFromCreation(structure.structureVersions, now) ||
        isFinalisationFormValidated(structure.forms);
      if (!isFinalised) {
        continue;
      }

      const currentVersion = resolveCurrentVersion(
        structure.structureVersions,
        now
      );
      const isClosed =
        currentVersion?.structureVersionTransformation?.type ===
        StructureVersionTransformationType.FERMETURE;
      if (isClosed) {
        continue;
      }

      const resolvedStructure = await getResolvedStructure(structure.id, now);
      if (!resolvedStructure) {
        continue;
      }

      await createActualisationCampaignShell(prisma, {
        structure: resolvedStructure,
        campaignDefinitionId: campaignDefinition.id,
        formDefinitionId: formDefinition.id,
        effectiveDate: now,
      });
      createdCount++;
    }

    console.log(
      `✅ actualisation-${actualisationYear} : ${createdCount} campagne(s) créée(s), ${structureIdsWithCampaign.size} déjà présente(s)`
    );
  } catch (error) {
    console.error("❌ Erreur création des campagnes d'actualisation:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await apiPrisma.$disconnect();
  }
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  run();
}
