import type { MessageApiRead } from "@/schemas/api/message.schema";
import type { ConversationAnchor } from "@/types/conversation.type";

export const buildConversationThread = (
  messages: MessageApiRead[],
  anchors: ConversationAnchor[]
): ConversationThreadItem[] =>
  [
    ...anchors.map(({ id, label, date }) => ({
      kind: "anchor" as const,
      elementId: `jalon-${id}`,
      date,
      label,
    })),
    ...messages.map((message) => ({
      kind: "message" as const,
      elementId: `message-${message.id}`,
      date: new Date(message.createdAt),
      message,
    })),
  ].sort((first, second) => first.date.getTime() - second.date.getTime());

export type ConversationThreadItem =
  | { kind: "anchor"; elementId: string; date: Date; label: string }
  | {
      kind: "message";
      elementId: string;
      date: Date;
      message: MessageApiRead;
    };
