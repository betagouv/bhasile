import type { Prisma } from "@/generated/prisma/client";

// Même compte pour le tiroir des échanges et la cloche
export const getUnreadMessageWhere = (
  userId: number
): Prisma.MessageWhereInput => ({
  authorId: { not: userId },
  receipts: { none: { userId } },
});

export const messageSelect = {
  id: true,
  text: true,
  tagKey: true,
  authorLevel: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
  receipts: {
    select: { createdAt: true, user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  },
  attachments: {
    select: {
      id: true,
      key: true,
      originalName: true,
      mimeType: true,
      fileSize: true,
    },
    orderBy: { id: "asc" },
  },
} satisfies Prisma.MessageSelect;

export type MessageDb = Prisma.MessageGetPayload<{
  select: typeof messageSelect;
}>;
