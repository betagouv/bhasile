import { randomUUID } from "node:crypto";

import {
  deleteTarificationTestData,
  pickTestCampaignYear,
} from "tests/test-utils/tarification.repository.helpers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createMessage,
  createMessageReceipts,
  findConversationMessageIds,
  findMessages,
  updateMessageTagKey,
  upsertConversation,
} from "@/app/api/conversations/conversation.repository";
import { upsertStructureTarification } from "@/app/api/tarifications/tarification.repository";
import { AuthorLevel, Visibility } from "@/generated/prisma/enums";
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
});
