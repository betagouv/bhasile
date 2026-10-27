export type ConversationTag = { key: string; label: string };

export type ConversationAnchor = {
  id: string;
  label: string;
  date: Date;
  startsTagKey?: string;
};

export type ConversationContext = {
  tags: ConversationTag[];
  anchors: ConversationAnchor[];
};

export const ConversationVisibility = ["SHARED", "AGENTS"] as const;

export type ConversationVisibility = (typeof ConversationVisibility)[number];
