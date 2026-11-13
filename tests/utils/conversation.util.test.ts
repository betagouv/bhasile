import { describe, expect, it } from "vitest";

import { MessageApiRead } from "@/schemas/api/message.schema";
import { buildConversationThread } from "@/utils/conversation.util";

const buildMessage = (id: number, createdAt: string): MessageApiRead => ({
  id,
  text: "Bonjour",
  tagKey: null,
  authorLevel: "DEPARTEMENT",
  createdAt,
  author: { id: 2, name: "Paul Martin" },
  receipts: [],
  attachments: [],
});

const buildAnchor = (id: string, date: string) => ({
  id,
  label: id,
  date: new Date(date),
});

describe("buildConversationThread", () => {
  it("trie les messages et les jalons par date", () => {
    const thread = buildConversationThread(
      [
        buildMessage(1, "2026-10-27T10:00:00.000Z"),
        buildMessage(2, "2026-10-27T12:00:00.000Z"),
      ],
      [
        buildAnchor("avant", "2026-10-27T09:00:00.000Z"),
        buildAnchor("entre", "2026-10-27T11:00:00.000Z"),
      ]
    );

    expect(thread.map(({ elementId }) => elementId)).toEqual([
      "jalon-avant",
      "message-1",
      "jalon-entre",
      "message-2",
    ]);
  });

  it("place le jalon avant le message à la même date", () => {
    const thread = buildConversationThread(
      [buildMessage(1, "2026-10-27T10:00:00.000Z")],
      [buildAnchor("meme-date", "2026-10-27T10:00:00.000Z")]
    );

    expect(thread.map(({ kind }) => kind)).toEqual(["anchor", "message"]);
  });
});
