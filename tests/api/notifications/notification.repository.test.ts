import { randomUUID } from "node:crypto";

import {
  deleteTarificationTestData,
  pickTestCampaignYear,
} from "tests/test-utils/tarification.repository.helpers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getUnreadMessageWhere } from "@/app/api/conversations/conversation.db.type";
import {
  createNotificationRead,
  findNotificationConversations,
  findNotificationTarifications,
  findNotificationUser,
  updateNotificationSeenAt,
} from "@/app/api/notifications/notification.repository";
import {
  AuthorLevel,
  TarificationDocumentStatus,
  TarificationEventType,
  Visibility,
} from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

describe("notification.repository db integration", () => {
  const campaignYear = pickTestCampaignYear(9500);
  let structureId: number;
  let readerId: number;
  let colleagueId: number;
  let depositEventId: number;

  beforeAll(async () => {
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `BHA-NOTIFICATION-TEST-${randomUUID()}`,
        departementAdministratif: "50",
      },
    });
    structureId = structure.id;
    readerId = (
      await prisma.user.create({
        data: { email: `notification-${randomUUID()}@test.fr` },
      })
    ).id;
    colleagueId = (
      await prisma.user.create({
        data: { email: `notification-${randomUUID()}@test.fr` },
      })
    ).id;
    const campaign = await prisma.tarificationCampaign.create({
      data: { year: campaignYear },
    });
    const tarification = await prisma.structureTarification.create({
      data: { structureId, campaignId: campaign.id },
    });
    const fileUpload = await prisma.fileUpload.create({
      data: {
        key: `notification-${randomUUID()}`,
        originalName: "ca.pdf",
        mimeType: "application/pdf",
        fileSize: 1,
      },
    });
    const document = await prisma.tarificationDocument.create({
      data: {
        structureTarificationId: tarification.id,
        fileUploadId: fileUpload.id,
        types: ["CA"],
        status: TarificationDocumentStatus.FINAL,
      },
    });
    depositEventId = (
      await prisma.tarificationEvent.create({
        data: {
          structureTarificationId: tarification.id,
          type: TarificationEventType.DOCUMENT_DEPOSITED,
          authorLevel: AuthorLevel.OPERATEUR,
          documentId: document.id,
        },
      })
    ).id;
    await prisma.tarificationDocumentOpening.create({
      data: { documentId: document.id, userId: colleagueId },
    });
    await prisma.conversation.create({
      data: {
        structureTarificationId: tarification.id,
        visibility: Visibility.SHARED,
        messages: {
          create: [
            {
              authorId: colleagueId,
              authorLevel: AuthorLevel.DEPARTEMENT,
              text: "Un",
            },
            {
              authorId: colleagueId,
              authorLevel: AuthorLevel.DEPARTEMENT,
              text: "Deux",
            },
            {
              authorId: colleagueId,
              authorLevel: AuthorLevel.DEPARTEMENT,
              text: "Déjà lu",
              receipts: { create: { userId: readerId } },
            },
            {
              authorId: readerId,
              authorLevel: AuthorLevel.DEPARTEMENT,
              text: "Moi",
            },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    await deleteTarificationTestData({ structureId, campaignYear });
    await prisma.user.deleteMany({
      where: { id: { in: [readerId, colleagueId] } },
    });
    await prisma.structure.delete({ where: { id: structureId } });
  });

  it("n'avance le repère que vers l'avant, sans dépasser l'horloge de la base", async () => {
    const recent = new Date(Date.now() - 60_000);
    await updateNotificationSeenAt(readerId, recent);
    await updateNotificationSeenAt(readerId, new Date(Date.now() - 3_600_000));
    expect((await findNotificationUser(readerId)).notificationSeenAt).toEqual(
      recent
    );

    await updateNotificationSeenAt(readerId, new Date(Date.now() + 3_600_000));
    const { notificationSeenAt } = await findNotificationUser(readerId);
    expect(notificationSeenAt!.getTime()).toBeGreaterThan(recent.getTime());
    expect(notificationSeenAt!.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("ne remonte que les lectures et les ouvertures de l'utilisateur, et une lecture écrite deux fois n'en fait qu'une", async () => {
    await createNotificationRead(readerId, depositEventId);
    await createNotificationRead(readerId, depositEventId);
    await createNotificationRead(colleagueId, depositEventId);

    const [tarification] = await findNotificationTarifications({
      where: { structureId },
      eventWhere: {},
      userId: readerId,
    });

    expect(tarification.events[0].notificationReads).toEqual([
      { userId: readerId },
    ]);
    expect(tarification.documents[0].openings).toEqual([]);
  });

  it("compte les messages d'autrui sans accusé de l'utilisateur", async () => {
    const [conversation] = await findNotificationConversations({
      where: { structureTarification: { structureId } },
      unreadMessageWhere: getUnreadMessageWhere(readerId),
    });

    expect(conversation._count.messages).toBe(2);
    expect(conversation.messages).toHaveLength(1);
  });
});
