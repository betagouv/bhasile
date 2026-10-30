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
