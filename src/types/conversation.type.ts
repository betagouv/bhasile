export type ConversationTag = { key: string; label: string };

export type ConversationAnchor = {
  id: string;
  label: string;
  date: Date;
  startsTagKey?: string;
  isMajor?: boolean;
};

export const ConversationVisibility = ["SHARED", "AGENTS"] as const;

export type ConversationVisibility = (typeof ConversationVisibility)[number];

export type NotificationRecipient = { userId: number; email: string };

export type PendingMessageNotification = {
  notificationId: number;
  messageId: number;
  conversationId: number;
  recipients: NotificationRecipient[];
  params: Record<string, string>;
};
