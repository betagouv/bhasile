import { randomUUID } from "node:crypto";

import {
  deleteTarificationTestData,
  pickTestCampaignYear,
} from "tests/test-utils/tarification.repository.helpers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createMessage,
  createMessageReceipts,
  createNotificationRecipients,
  findConversationMessageIds,
  findMessages,
  findNotifiedPairs,
  findReadPairs,
  findStaleNotificationIds,
  findUnreadMessageCounts,
  markNotificationsAbandoned,
  markNotificationsProcessed,
  updateMessageTagKey,
  upsertConversation,
} from "@/app/api/conversations/conversation.repository";
import { upsertStructureTarification } from "@/app/api/tarifications/tarification.repository";
import {
  AuthorLevel,
  TarificationDocumentStatus,
  Visibility,
} from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

describe("conversation.repository db integration", () => {
  const campaignYear = pickTestCampaignYear(9500);
  let structureId: number;
  let authorId: number;
  let structureTarificationId: number;

  beforeAll(async () => {
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `BHA-CONV-TEST-${randomUUID()}`,
        departementAdministratif: "50",
      },
    });
    structureId = structure.id;
    const author = await prisma.user.create({
      data: { email: `conversation-${randomUUID()}@test.fr` },
    });
    authorId = author.id;
    const tarification = await upsertStructureTarification(
      structureId,
      campaignYear
    );
    structureTarificationId = tarification.id;
  });

  afterAll(async () => {
    await deleteTarificationTestData({ structureId, campaignYear });
    await prisma.structure.delete({ where: { id: structureId } });
    await prisma.user.delete({ where: { id: authorId } });
    await prisma.$disconnect();
  });

  const postMessage = async (visibility: Visibility, text: string) => {
    const conversation = await upsertConversation(
      structureTarificationId,
      visibility
    );
    return createMessage({
      conversationId: conversation.id,
      authorId,
      authorLevel: AuthorLevel.DEPARTEMENT,
      text,
      tagKey: null,
      fileKeys: [],
    });
  };

  it("crée une seule conversation par tarification et par canal", async () => {
    const first = await upsertConversation(
      structureTarificationId,
      Visibility.SHARED
    );
    const second = await upsertConversation(
      structureTarificationId,
      Visibility.SHARED
    );
    const agents = await upsertConversation(
      structureTarificationId,
      Visibility.AGENTS
    );

    expect(second.id).toBe(first.id);
    expect(agents.id).not.toBe(first.id);
  });

  it("ne renvoie que les messages du canal demandé, dans l'ordre", async () => {
    const firstShared = await postMessage(Visibility.SHARED, "premier");
    const internal = await postMessage(Visibility.AGENTS, "interne");
    const secondShared = await postMessage(Visibility.SHARED, "second");
    const postedIds = [firstShared.id, internal.id, secondShared.id];

    const sharedMessages = await findMessages(
      structureTarificationId,
      Visibility.SHARED
    );

    expect(
      sharedMessages
        .filter((message) => postedIds.includes(message.id))
        .map((message) => message.text)
    ).toEqual(["premier", "second"]);
  });

  it("enregistre une seule lecture par message et par utilisateur", async () => {
    const message = await postMessage(Visibility.SHARED, "à lire");

    await createMessageReceipts(authorId, [message.id]);
    const secondRead = await createMessageReceipts(authorId, [message.id]);

    expect(secondRead.count).toBe(0);
    expect(
      await prisma.messageReceipt.count({ where: { messageId: message.id } })
    ).toBe(1);
  });

  it("compte par canal les messages d'autrui sans accusé du lecteur", async () => {
    const reader = await prisma.user.create({
      data: { email: `lecteur-${randomUUID()}@test.fr` },
    });
    const countUnread = async () =>
      Object.fromEntries(
        (await findUnreadMessageCounts(structureTarificationId, reader.id)).map(
          ({ visibility, _count }) => [visibility, _count.messages]
        )
      );
    const before = await countUnread();
    const read = await postMessage(Visibility.SHARED, "lu");
    await postMessage(Visibility.SHARED, "non lu");
    await postMessage(Visibility.AGENTS, "non lu agents");
    await createMessageReceipts(reader.id, [read.id]);
    await createMessageReceipts(authorId, [read.id]);

    expect(await countUnread()).toEqual({
      SHARED: (before.SHARED ?? 0) + 1,
      AGENTS: (before.AGENTS ?? 0) + 1,
    });
    expect(
      await findUnreadMessageCounts(structureTarificationId, authorId)
    ).toEqual(
      expect.arrayContaining([
        { visibility: Visibility.AGENTS, _count: { messages: 0 } },
      ])
    );

    await prisma.messageReceipt.deleteMany({ where: { userId: reader.id } });
    await prisma.user.delete({ where: { id: reader.id } });
  });

  it("renvoie les lectures de chaque message avec leur lecteur", async () => {
    const message = await postMessage(Visibility.SHARED, "lu par l'auteur");
    await createMessageReceipts(authorId, [message.id]);

    const messages = await findMessages(
      structureTarificationId,
      Visibility.SHARED
    );

    expect(
      messages
        .find((foundMessage) => foundMessage.id === message.id)
        ?.receipts.map((receipt) => receipt.user.id)
    ).toEqual([authorId]);
  });

  it("ne garde que les identifiants des messages de la conversation demandée", async () => {
    const shared = await postMessage(Visibility.SHARED, "partagé");
    const internal = await postMessage(Visibility.AGENTS, "interne");

    const ids = await findConversationMessageIds(
      structureTarificationId,
      Visibility.SHARED,
      [shared.id, internal.id]
    );

    expect(ids).toEqual([shared.id]);
  });

  it("modifie l'étiquette d'un message sans toucher à son texte", async () => {
    const message = await postMessage(Visibility.AGENTS, "à étiqueter");

    const tagged = await updateMessageTagKey(message.id, "L48");

    expect(tagged).toMatchObject({ tagKey: "L48", text: "à étiqueter" });
  });

  const createAttachment = () =>
    prisma.fileUpload.create({
      data: {
        key: `conversation-${randomUUID()}.pdf`,
        mimeType: "application/pdf",
        fileSize: 10,
        originalName: "justificatif.pdf",
      },
    });

  const postMessageWithFiles = async (fileKeys: string[]) => {
    const conversation = await upsertConversation(
      structureTarificationId,
      Visibility.SHARED
    );
    return createMessage({
      conversationId: conversation.id,
      authorId,
      authorLevel: AuthorLevel.DEPARTEMENT,
      text: "",
      tagKey: null,
      fileKeys,
    });
  };

  it("rattache les pièces jointes au message par leur clé", async () => {
    const file = await createAttachment();

    const message = await postMessageWithFiles([file.key]);

    expect(message.attachments.map((attachment) => attachment.key)).toEqual([
      file.key,
    ]);
  });

  it("refuse une pièce jointe rattachée à un document de tarification", async () => {
    const file = await createAttachment();
    await prisma.tarificationDocument.create({
      data: {
        structureTarificationId,
        fileUploadId: file.id,
        types: ["CA"],
        status: TarificationDocumentStatus.SHARED,
      },
    });

    await expect(postMessageWithFiles([file.key])).rejects.toThrow(
      "déjà rattachée"
    );
  });

  it("refuse une pièce jointe déjà rattachée, sans créer le message", async () => {
    const file = await createAttachment();
    const first = await postMessageWithFiles([file.key]);
    const countConversationMessages = () =>
      prisma.message.count({
        where: { conversation: { structureTarificationId } },
      });
    const messageCountBefore = await countConversationMessages();

    await expect(postMessageWithFiles([file.key])).rejects.toThrow(
      "déjà rattachée"
    );

    expect(await countConversationMessages()).toBe(messageCountBefore);
    expect(
      await prisma.fileUpload.findUnique({ where: { key: file.key } })
    ).toMatchObject({ messageId: first.id });
  });

  const getNotificationId = async (messageId: number): Promise<number> => {
    const notification = await prisma.emailNotification.findUniqueOrThrow({
      where: { messageId },
      select: { id: true },
    });
    return notification.id;
  };

  it("met chaque message en attente de notification dès sa création", async () => {
    const { id: messageId } = await postMessage(
      Visibility.SHARED,
      "À notifier"
    );

    expect(
      await prisma.emailNotification.findUniqueOrThrow({ where: { messageId } })
    ).toMatchObject({ processedAt: null, abandonedAt: null });
  });

  it("ne garde aucune notification d'un message dont la création échoue", async () => {
    const countBefore = await prisma.emailNotification.count();

    await expect(postMessageWithFiles(["cle-inconnue"])).rejects.toThrow();

    expect(await prisma.emailNotification.count()).toBe(countBefore);
  });

  it("renvoie les notifications encore en attente créées avant la date donnée", async () => {
    const pending = await postMessage(Visibility.SHARED, "À notifier");
    const processed = await postMessage(Visibility.SHARED, "Déjà notifié");
    const abandoned = await postMessage(Visibility.SHARED, "Abandonné");
    const pendingId = await getNotificationId(pending.id);
    const processedId = await getNotificationId(processed.id);
    const abandonedId = await getNotificationId(abandoned.id);
    await markNotificationsProcessed([processedId], new Date());
    await markNotificationsAbandoned([abandonedId], new Date());

    const staleIds = await findStaleNotificationIds(
      new Date(Date.now() + 1000)
    );

    expect(staleIds).toContain(pendingId);
    expect(staleIds).not.toContain(processedId);
    expect(staleIds).not.toContain(abandonedId);
    expect(await findStaleNotificationIds(new Date(0))).not.toContain(
      pendingId
    );
  });

  it("trace un même mail pour plusieurs messages et distingue les signalements des lectures", async () => {
    const first = await postMessage(Visibility.SHARED, "Premier");
    const second = await postMessage(Visibility.SHARED, "Second");
    const read = await postMessage(Visibility.SHARED, "Lu");
    const pending = await postMessage(Visibility.SHARED, "À signaler");
    const brevoMessageId = `<${randomUUID()}>`;
    await createNotificationRecipients(
      await Promise.all(
        [first, second].map(async (message) => ({
          notificationId: await getNotificationId(message.id),
          userId: authorId,
          email: "agent@test.fr",
          brevoMessageId,
        }))
      )
    );
    await createMessageReceipts(authorId, [read.id]);

    const messageIds = [first.id, second.id, read.id, pending.id];
    const notifiedPairs = await findNotifiedPairs(messageIds);
    const readPairs = await findReadPairs(messageIds);

    expect(notifiedPairs.map((pair) => pair.messageId).sort()).toEqual(
      [first.id, second.id].sort()
    );
    expect(readPairs.map((pair) => pair.messageId)).toEqual([read.id]);
  });
});
