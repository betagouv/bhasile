import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  findCampaignDeadline,
  findDashboardStructures,
} from "@/app/api/dashboard/initialisations-actualisations/initialisations-actualisations.repository";
import { FINALISATION_FORM_SLUG } from "@/app/api/forms/form.constants";
import prisma from "@/lib/prisma";
import { StructureType } from "@/types/structure.type";

describe("initialisations-actualisations.repository db integration", () => {
  const createdStructureIds: number[] = [];
  const deadlineSlug = `dashboard-test-deadline-${randomUUID()}`;
  const deadline = new Date("2026-08-30T00:00:00.000Z");
  let finalisationFormDefinitionId: number;
  let deadlineDefinitionId: number;

  beforeAll(async () => {
    const finalisationDefinition = await prisma.formDefinition.upsert({
      where: { slug: FINALISATION_FORM_SLUG },
      update: {},
      create: { slug: FINALISATION_FORM_SLUG, name: "finalisation", version: 1 },
    });
    finalisationFormDefinitionId = finalisationDefinition.id;

    const deadlineDefinition = await prisma.campaignDefinition.create({
      data: {
        slug: deadlineSlug,
        name: "Test échéance dashboard",
        version: 1,
        deadline,
      },
    });
    deadlineDefinitionId = deadlineDefinition.id;
  });

  afterAll(async () => {
    await prisma.structure.deleteMany({
      where: { id: { in: createdStructureIds } },
    });
    await prisma.campaignDefinition.delete({
      where: { id: deadlineDefinitionId },
    });
    await prisma.$disconnect();
  });

  it("récupère type au niveau Structure, le form de finalisation filtré et la version", async () => {
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `BHA-DASH-${randomUUID()}`,
        type: StructureType.CADA,
        structureVersions: {
          create: {
            effectiveDate: new Date("2024-01-01"),
            communeAdministrative: "Avranches",
          },
        },
        forms: {
          create: {
            formDefinitionId: finalisationFormDefinitionId,
            status: true,
          },
        },
      },
    });
    createdStructureIds.push(structure.id);

    const structures = await findDashboardStructures();
    const found = structures.find((candidate) => candidate.id === structure.id);

    expect(found).toBeDefined();
    expect(found?.type).toBe(StructureType.CADA);
    expect(found?.forms).toEqual([{ status: true }]);
    expect(found?.structureVersions).toHaveLength(1);
    expect(found?.structureVersions[0]?.communeAdministrative).toBe("Avranches");
  });

  it("récupère l'échéance d'une campagne par slug", async () => {
    const definition = await findCampaignDeadline(deadlineSlug);

    expect(definition?.deadline?.toISOString()).toBe(deadline.toISOString());
  });
});
