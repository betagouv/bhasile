import prisma from "@/lib/prisma";
import { CampaignApiWrite } from "@/schemas/api/campaign.schema";
import { StructureCampaignApiRead } from "@/schemas/api/structure.schema";
import { StepStatus } from "@/types/form.type";

import { createOrUpdateActesAdministratifs } from "../actes-administratifs/acte-administratif.repository";
import { createOrUpdateBudgets } from "../budgets/budget.repository";
import { createOrUpdateDocumentsFinanciers } from "../documents-financiers/documentFinancier.repository";
import {
  setCampaignFormStatus,
  setCampaignFormStepStatus,
} from "../forms/form.repository";
import { createOrUpdateIndicateursFinanciers } from "../indicateurs-financiers/indicateur-financier.repository";
import { createOrUpdateStructureVersion } from "../structure-versions/structure-version.repository";
import { copyStructureVersion } from "../structure-versions/structure-version.service";
import { StructureDbDetails } from "../structures/structure.db.type";
import { actualisationCampaignDefinitionSlug } from "./campaign.constants";

export const updateActualisationCampaign = async (
  input: CampaignApiWrite,
  structure: StructureDbDetails
): Promise<StructureCampaignApiRead> => {
  const now = new Date();
  const slug = actualisationCampaignDefinitionSlug(input.year);

  return prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.findFirst({
      where: {
        campaignDefinition: { slug },
        structureVersion: { structureId: input.structureId },
      },
      include: {
        form: { select: { id: true, status: true } },
        structureVersion: { select: { id: true } },
      },
    });

    if (!campaign) {
      throw new Error(
        `Aucune campagne d'actualisation ${input.year} pour la structure ${input.structureId}`
      );
    }
    if (!campaign.structureVersion) {
      throw new Error(`Campagne ${campaign.id} sans StructureVersion`);
    }
    if (!campaign.form) {
      throw new Error(`Campagne ${campaign.id} sans Form`);
    }
    if (campaign.form.status === true) {
      throw new Error(
        `Structure ${input.structureId} déjà actualisée pour ${input.year}`
      );
    }

    const structureVersionId = campaign.structureVersion.id;
    const formId = campaign.form.id;
    const parent = { structureId: input.structureId, campaignId: campaign.id };

    if (input.validate) {
      const version = copyStructureVersion(structure, {
        id: structureVersionId,
        effectiveDate: now.toISOString(),
        ...(input.structureTypologies
          ? { structureTypologies: input.structureTypologies }
          : {}),
      });
      await createOrUpdateStructureVersion(tx, version, parent);
    } else if (input.structureTypologies) {
      await createOrUpdateStructureVersion(
        tx,
        { id: structureVersionId, structureTypologies: input.structureTypologies },
        parent
      );
    }

    const structureEntity = { structureId: input.structureId };
    if (input.budgets) {
      await createOrUpdateBudgets(tx, input.budgets, structureEntity);
    }
    if (input.indicateursFinanciers) {
      await createOrUpdateIndicateursFinanciers(
        tx,
        input.indicateursFinanciers,
        structureEntity
      );
    }
    if (input.documentsFinanciers) {
      await createOrUpdateDocumentsFinanciers(
        tx,
        input.documentsFinanciers,
        structureEntity
      );
    }
    if (input.actesAdministratifs) {
      await createOrUpdateActesAdministratifs(
        tx,
        input.actesAdministratifs,
        structureEntity,
        { skipOrphanDelete: true }
      );
    }

    if (input.step) {
      await setCampaignFormStepStatus(
        tx,
        formId,
        input.step.slug,
        input.step.status
      );
    }
    if (input.validate) {
      await setCampaignFormStatus(tx, formId, true);
    }

    const updated = await tx.campaign.findUniqueOrThrow({
      where: { id: campaign.id },
      include: {
        campaignDefinition: true,
        form: {
          include: { formSteps: { include: { stepDefinition: true } } },
        },
      },
    });

    return {
      slug: updated.campaignDefinition?.slug ?? slug,
      isValidated: updated.form?.status === true,
      formSteps:
        updated.form?.formSteps.map((formStep) => ({
          slug: formStep.stepDefinition.slug,
          status: formStep.status as unknown as StepStatus,
        })) ?? [],
    };
  });
};
