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
    await createActualisationCampaignShell(prisma, {
      structureId,
      campaignDefinitionId,
      formDefinitionId,
    });
  };

  const findCampaignVersion = (structureId: number) =>
    prisma.structureVersion.findFirstOrThrow({
      where: { structureId, campaignId: { not: null } },
      include: { contacts: true, structureTypologies: true },
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

  it("crée une coquille : campagne + SV liée vide + form non validé + steps non commencés", async () => {
    const structure = await createFinalisedStructure();
    await openCampaignFor(structure.id);

    const campaign = await prisma.campaign.findFirstOrThrow({
      where: {
        campaignDefinitionId,
        structureVersion: { structureId: structure.id },
      },
      include: {
        structureVersion: true,
        form: { include: { formSteps: true } },
      },
    });

    expect(campaign.structureVersion?.effectiveDate).toBeNull();
    expect(campaign.structureVersion?.type).toBeNull();
    expect(campaign.form?.status).toBe(false);
    expect(campaign.form?.formSteps).toHaveLength(
      ACTUALISATION_FORM_STEP_SLUGS.length
    );
    expect(
      campaign.form?.formSteps.every(
        (formStep) => formStep.status === StepStatus.NON_COMMENCE
      )
    ).toBe(true);
  });

  it("rejette une structure sans campagne ouverte", async () => {
    const structure = await createFinalisedStructure();

    await expect(
      updateActualisationCampaign(
        { structureId: structure.id, year: ACTUALISATION_YEAR },
        {} as StructureDbDetails
      )
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
      updateActualisationCampaign(
        { structureId: structure.id, year: ACTUALISATION_YEAR },
        {} as StructureDbDetails
      )
    ).rejects.toThrow(/déjà actualisée/);
  });

  it("écrit la typologie sur la coquille sans cloner les autres relations ni dater la version", async () => {
    const structure = await createFinalisedStructure();
    await openCampaignFor(structure.id);
    const resolved = await getResolvedStructure(structure.id);
    expect(resolved).not.toBeNull();

    await updateActualisationCampaign(
      {
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
      },
      resolved as StructureDbDetails
    );

    const version = await findCampaignVersion(structure.id);
    expect(version.effectiveDate).toBeNull();
    expect(version.contacts).toHaveLength(0);
    expect(version.structureTypologies).toHaveLength(1);
    expect(version.structureTypologies[0]).toMatchObject({
      year: ACTUALISATION_YEAR,
      placesAutorisees: 55,
    });
  });

  it("à la validation clone les relations du prédécesseur, préserve la typologie éditée, date et valide", async () => {
    const structure = await createFinalisedStructure();
    await openCampaignFor(structure.id);
    const resolved = await getResolvedStructure(structure.id);

    await updateActualisationCampaign(
      {
        structureId: structure.id,
        year: ACTUALISATION_YEAR,
        structureTypologies: [
          {
            year: ACTUALISATION_YEAR,
            placesAutorisees: 60,
            pmr: 0,
            lgbt: 0,
            fvvTeh: 0,
          },
        ],
      },
      resolved as StructureDbDetails
    );

    await updateActualisationCampaign(
      { structureId: structure.id, year: ACTUALISATION_YEAR, validate: true },
      resolved as StructureDbDetails
    );

    const version = await findCampaignVersion(structure.id);
    expect(version.effectiveDate).not.toBeNull();
    expect(version.contacts).toHaveLength(1);
    expect(version.contacts[0]).toMatchObject({ nom: "Dupont" });
    expect(version.structureTypologies[0]).toMatchObject({
      year: ACTUALISATION_YEAR,
      placesAutorisees: 60,
    });

    const validated = await getResolvedStructure(structure.id);
    const allVersions = await prisma.structureVersion.findMany({
      where: { structureId: structure.id },
      include: {
        structureVersionTransformation: {
          include: { transformation: { include: { form: true } } },
        },
        campaign: { include: { form: true } },
      },
    });
    expect(validated).not.toBeNull();
    expect(resolveCurrentVersion(allVersions, new Date())?.id).toBe(version.id);
  });

  it("à la validation sans édition préalable, retombe sur la typologie du prédécesseur", async () => {
    const structure = await createFinalisedStructure();
    await openCampaignFor(structure.id);
    const resolved = await getResolvedStructure(structure.id);

    await updateActualisationCampaign(
      { structureId: structure.id, year: ACTUALISATION_YEAR, validate: true },
      resolved as StructureDbDetails
    );

    const version = await findCampaignVersion(structure.id);
    expect(version.effectiveDate).not.toBeNull();
    expect(version.structureTypologies).toHaveLength(1);
    expect(version.structureTypologies[0]).toMatchObject({
      year: 2024,
      placesAutorisees: 10,
    });
  });
});
