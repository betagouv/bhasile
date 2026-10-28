import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  findMessageTarification,
  findStructureTarification,
  findStructureTarificationCampaigns,
  upsertStructureTarification,
} from "@/app/api/tarifications/tarification.repository";
import { AuthorLevel, Visibility } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

describe("tarification.repository db integration", () => {
  const campaignYear = 9000 + Math.floor(Math.random() * 500);
  let structureId: number;
  let authorId: number;

  beforeAll(async () => {
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `BHA-TARIF-TEST-${randomUUID()}`,
        departementAdministratif: "50",
      },
    });
    structureId = structure.id;
    const author = await prisma.user.create({
      data: { email: `tarification-${randomUUID()}@test.fr` },
    });
    authorId = author.id;
  });

  afterAll(async () => {
    const conversationWhere = { structureTarification: { structureId } };
    await prisma.message.deleteMany({
      where: { conversation: conversationWhere },
    });
    await prisma.conversation.deleteMany({ where: conversationWhere });
    await prisma.structureTarification.deleteMany({ where: { structureId } });
    await prisma.tarificationCampaign.deleteMany({
      where: { year: campaignYear },
    });
    await prisma.structure.delete({ where: { id: structureId } });
    await prisma.user.delete({ where: { id: authorId } });
    await prisma.$disconnect();
  });

  it("crée la campagne et la tarification une seule fois", async () => {
    const first = await upsertStructureTarification(structureId, campaignYear);
    const second = await upsertStructureTarification(structureId, campaignYear);

    expect(second.id).toBe(first.id);
    expect(
      await prisma.tarificationCampaign.count({ where: { year: campaignYear } })
    ).toBe(1);
  });

  it("retrouve la tarification par structure et année", async () => {
    const created = await upsertStructureTarification(
      structureId,
      campaignYear
    );

    const found = await findStructureTarification(structureId, campaignYear);

    expect(found?.id).toBe(created.id);
  });

  it("liste les campagnes où la structure a une tarification", async () => {
    await upsertStructureTarification(structureId, campaignYear);

    expect(await findStructureTarificationCampaigns(structureId)).toEqual([
      { campaign: { year: campaignYear } },
    ]);
  });

  it("ne trouve rien pour une campagne sans échange", async () => {
    expect(
      await findStructureTarification(structureId, campaignYear + 1)
    ).toBeNull();
  });

  it("remonte d'un message à sa structure et à l'année de sa campagne", async () => {
    const tarification = await upsertStructureTarification(
      structureId,
      campaignYear
    );
    const message = await prisma.message.create({
      data: {
        conversation: {
          connectOrCreate: {
            where: {
              structureTarificationId_visibility: {
                structureTarificationId: tarification.id,
                visibility: Visibility.SHARED,
              },
            },
            create: {
              structureTarificationId: tarification.id,
              visibility: Visibility.SHARED,
            },
          },
        },
        author: { connect: { id: authorId } },
        authorLevel: AuthorLevel.DEPARTEMENT,
        text: "message",
      },
    });

    const found = await findMessageTarification(message.id);

    expect(found?.conversation.structureTarification).toEqual({
      structure: {
        id: structureId,
        departementAdministratif: "50",
        operateurId: null,
      },
      campaign: { year: campaignYear },
    });
  });
});
