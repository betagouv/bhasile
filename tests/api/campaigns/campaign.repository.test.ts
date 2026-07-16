import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { actualisationCampaignDefinitionSlug } from "@/app/api/campaigns/campaign.constants";
import { updateActualisationCampaign } from "@/app/api/campaigns/campaign.repository";
import {
  ACTUALISATION_FORM_SLUG,
  ACTUALISATION_FORM_STEP_SLUGS,
} from "@/app/api/forms/form.constants";
import { resolveCurrentVersion } from "@/app/api/structure-versions/structure-version.util";
import { StructureDbDetails } from "@/app/api/structures/structure.db.type";
import { getResolvedStructure } from "@/app/api/structures/structure.service";
import prisma from "@/lib/prisma";
import { StepStatus } from "@/types/form.type";
import { StructureType } from "@/types/structure.type";

import { createActualisationCampaignShell } from "../../../scripts/recurring-scripts/create-actualisation-campaigns";

const ACTUALISATION_YEAR = 2099;

describe("campaign.repository db integration", () => {
  const createdStructureIds: number[] = [];
  let campaignDefinitionId: number;
  let formDefinitionId: number;

  const createFinalisedStructure = async () => {
    const structure = await prisma.structure.create({
      data: { codeBhasile: `BHA-CMP-${randomUUID()}` },
    });
    createdStructureIds.push(structure.id);
    await prisma.structureVersion.create({
      data: {
        structureId: structure.id,
        effectiveDate: new Date("2024-01-01"),
        type: StructureType.HUDA,
        nom: "Prédécesseur",
        contacts: { create: [{ nom: "Dupont", prenom: "Jean" }] },
        structureTypologies: { create: [{ year: 2024, placesAutorisees: 10 }] },
      },
    });
    return structure;
  };

  const openCampaignFor = async (structureId: number) => {
    const resolved = await getResolvedStructure(structureId);
    await createActualisationCampaignShell(prisma, {
      structure: resolved as StructureDbDetails,
      campaignDefinitionId,
      formDefinitionId,
      effectiveDate: new Date(),
    });
  };

  const findCampaignVersion = (structureId: number) =>
    prisma.structureVersion.findFirstOrThrow({
      where: { structureId, campaignId: { not: null } },
      include: { contacts: true, structureTypologies: true },
    });

  const findAllResolvableVersions = (structureId: number) =>
    prisma.structureVersion.findMany({
      where: { structureId },
      include: {
        structureVersionTransformation: {
          include: { transformation: { include: { form: true } } },
        },
        campaign: { include: { form: true } },
      },
    });

  const markAllStepsValidated = (structureId: number) =>
    prisma.formStep.updateMany({
      where: {
        form: {
          campaign: {
            campaignDefinition: {
              slug: actualisationCampaignDefinitionSlug(ACTUALISATION_YEAR),
            },
            structureVersion: { structureId },
          },
        },
      },
      data: { status: StepStatus.VALIDE },
    });

  beforeAll(async () => {
    const campaignDefinition = await prisma.campaignDefinition.upsert({
      where: { slug: actualisationCampaignDefinitionSlug(ACTUALISATION_YEAR) },
      update: {},
      create: {
        slug: actualisationCampaignDefinitionSlug(ACTUALISATION_YEAR),
        name: `Actualisation ${ACTUALISATION_YEAR}`,
        version: 1,
      },
    });
    campaignDefinitionId = campaignDefinition.id;

    const formDefinition = await prisma.formDefinition.upsert({
      where: { slug: ACTUALISATION_FORM_SLUG },
      update: {},
      create: { slug: ACTUALISATION_FORM_SLUG, name: "actualisation", version: 1 },
    });
    formDefinitionId = formDefinition.id;

    for (const stepSlug of ACTUALISATION_FORM_STEP_SLUGS) {
      await prisma.formStepDefinition.upsert({
        where: {
          formDefinitionId_slug: { formDefinitionId, slug: stepSlug },
        },
        update: {},
        create: { formDefinitionId, label: stepSlug, slug: stepSlug },
      });
    }
  });

  afterAll(async () => {
    await prisma.campaign.deleteMany({ where: { campaignDefinitionId } });
    if (createdStructureIds.length > 0) {
      await prisma.structure.deleteMany({
        where: { id: { in: createdStructureIds } },
      });
    }
    // La CampaignDefinition (année 2099) est propre au test ; la FormDefinition
    // actualisation est partagée avec le seed (slug non daté) — on ne la supprime pas.
    await prisma.campaignDefinition.deleteMany({
      where: { id: campaignDefinitionId },
    });
  });

  it("crée une campagne + une version valide clonée qui devient courante", async () => {
    const structure = await createFinalisedStructure();
    await openCampaignFor(structure.id);

    const campaign = await prisma.campaign.findFirstOrThrow({
      where: {
        campaignDefinitionId,
        structureVersion: { structureId: structure.id },
      },
      include: {
        structureVersion: {
          include: { contacts: true, structureTypologies: true },
        },
        form: { include: { formSteps: true } },
      },
    });

    expect(campaign.structureVersion?.effectiveDate).not.toBeNull();
    expect(campaign.structureVersion?.contacts).toHaveLength(1);
    expect(campaign.structureVersion?.structureTypologies).toHaveLength(1);
    expect(campaign.form?.status).toBe(false);
    expect(campaign.form?.formSteps).toHaveLength(
      ACTUALISATION_FORM_STEP_SLUGS.length
    );
    expect(
      campaign.form?.formSteps.every(
        (formStep) => formStep.status === StepStatus.NON_COMMENCE
      )
    ).toBe(true);

    const allVersions = await findAllResolvableVersions(structure.id);
    expect(resolveCurrentVersion(allVersions, new Date())?.id).toBe(
      campaign.structureVersion?.id
    );
  });

  it("rejette une structure sans campagne ouverte", async () => {
    const structure = await createFinalisedStructure();

    await expect(
      updateActualisationCampaign({
        structureId: structure.id,
        year: ACTUALISATION_YEAR,
      })
    ).rejects.toThrow(/Aucune campagne/);
  });

  it("rejette une actualisation déjà validée", async () => {
    const structure = await createFinalisedStructure();
    await openCampaignFor(structure.id);
    await prisma.form.updateMany({
      where: { campaign: { structureVersion: { structureId: structure.id } } },
      data: { status: true },
    });

    await expect(
      updateActualisationCampaign({
        structureId: structure.id,
        year: ACTUALISATION_YEAR,
      })
    ).rejects.toThrow(/déjà actualisée/);
  });

  it("écrit la typologie sur la version courante (= la SV campagne), visible immédiatement", async () => {
    const structure = await createFinalisedStructure();
    await openCampaignFor(structure.id);

    await updateActualisationCampaign({
      structureId: structure.id,
      year: ACTUALISATION_YEAR,
      structureTypologies: [
        {
          year: ACTUALISATION_YEAR,
          placesAutorisees: 55,
          pmr: 0,
          lgbt: 0,
          fvvTeh: 0,
        },
      ],
    });

    const version = await findCampaignVersion(structure.id);
    // relations clonées préservées (l'écriture typologie ne les touche pas)
    expect(version.contacts).toHaveLength(1);
    const typology = version.structureTypologies.find(
      (structureTypology) => structureTypology.year === ACTUALISATION_YEAR
    );
    expect(typology).toMatchObject({
      year: ACTUALISATION_YEAR,
      placesAutorisees: 55,
    });

    // la SV campagne reste la version courante → l'édition est visible
    const allVersions = await findAllResolvableVersions(structure.id);
    expect(resolveCurrentVersion(allVersions, new Date())?.id).toBe(version.id);
  });

  it("à la validation, ne fait que passer form.status à true (pas de clone)", async () => {
    const structure = await createFinalisedStructure();
    await openCampaignFor(structure.id);
    await markAllStepsValidated(structure.id);
    const before = await findCampaignVersion(structure.id);

    const result = await updateActualisationCampaign({
      structureId: structure.id,
      year: ACTUALISATION_YEAR,
      validate: true,
    });

    expect(result.isValidated).toBe(true);
    const after = await findCampaignVersion(structure.id);
    expect(after.id).toBe(before.id);
    expect(after.effectiveDate).toEqual(before.effectiveDate);
  });

  it("refuse la validation tant que toutes les étapes ne sont pas validées", async () => {
    const structure = await createFinalisedStructure();
    await openCampaignFor(structure.id);

    await expect(
      updateActualisationCampaign({
        structureId: structure.id,
        year: ACTUALISATION_YEAR,
        validate: true,
      })
    ).rejects.toThrow(/étapes doivent être validées/);
  });
});
