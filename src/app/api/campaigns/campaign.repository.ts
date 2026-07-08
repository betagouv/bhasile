import { ApiDomainError } from "@/app/utils/apiErrorResponse.util";
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
import { currentVersionWhere } from "../structure-versions/structure-version.db.type";
import { createOrUpdateStructureVersion } from "../structure-versions/structure-version.repository";
import { actualisationCampaignDefinitionSlug } from "./campaign.constants";

export const updateActualisationCampaign = async (
  input: CampaignApiWrite
): Promise<StructureCampaignApiRead> => {
  const now = new Date();
  const slug = actualisationCampaignDefinitionSlug(input.year);

  return prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.findFirst({
      where: {
        campaignDefinition: { slug },
        structureVersion: { structureId: input.structureId },
      },
      include: { form: { select: { id: true, status: true } } },
    });

    if (!campaign) {
      throw new ApiDomainError(
        `Aucune campagne d'actualisation ${input.year} pour la structure ${input.structureId}`,
        404
      );
    }
    if (!campaign.form) {
      throw new Error(`Campagne ${campaign.id} sans Form`);
    }
    if (campaign.form.status === true) {
      throw new ApiDomainError(
        `Structure ${input.structureId} déjà actualisée pour ${input.year}`,
        409
      );
    }
    const formId = campaign.form.id;

    if (input.structureTypologies) {
      const currentVersion = await tx.structureVersion.findFirst({
        where: {
          structureId: input.structureId,
          ...currentVersionWhere(now),
        },
        orderBy: [{ effectiveDate: "desc" }, { id: "desc" }],
        select: { id: true },
      });
      if (!currentVersion) {
        throw new Error(
          `Aucune version courante pour la structure ${input.structureId}`
        );
      }
      await createOrUpdateStructureVersion(
        tx,
        {
          id: currentVersion.id,
          structureTypologies: input.structureTypologies,
        },
        { structureId: input.structureId }
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
      const formSteps = await tx.formStep.findMany({
        where: { formId },
        select: { status: true },
      });
      const allStepsValidated =
        formSteps.length > 0 &&
        formSteps.every(
          (formStep) =>
            (formStep.status as unknown as StepStatus) === StepStatus.VALIDE
        );
      if (!allStepsValidated) {
        throw new ApiDomainError(
          `Toutes les étapes doivent être validées avant de valider l'actualisation ${input.year}`,
          409
        );
      }
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
