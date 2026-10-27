import { randomUUID } from "node:crypto";

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
  const campaignYear = 9500 + Math.floor(Math.random() * 500);
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
    const conversationWhere = { structureTarificationId };
    await prisma.messageReceipt.deleteMany({
      where: { message: { conversation: conversationWhere } },
    });
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

  it("ne renvoie que les messages du canal demandé, postérieurs au dernier reçu, dans l'ordre", async () => {
    const firstShared = await postMessage(Visibility.SHARED, "premier");
    const internal = await postMessage(Visibility.AGENTS, "interne");
    const secondShared = await postMessage(Visibility.SHARED, "second");
    const postedIds = [firstShared.id, internal.id, secondShared.id];

    const allShared = await findMessages(
      structureTarificationId,
      Visibility.SHARED,
      0
    );
    const afterFirst = await findMessages(
      structureTarificationId,
      Visibility.SHARED,
      firstShared.id
    );

    expect(
      allShared
        .filter((message) => postedIds.includes(message.id))
        .map((message) => message.text)
    ).toEqual(["premier", "second"]);
    expect(
      afterFirst
        .filter((message) => postedIds.includes(message.id))
        .map((message) => message.id)
    ).toEqual([secondShared.id]);
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
});
