import type { Prisma } from "@/generated/prisma/client";

export const messageSelect = {
  id: true,
  text: true,
  tagKey: true,
  authorLevel: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
} satisfies Prisma.MessageSelect;

export type MessageDb = Prisma.MessageGetPayload<{
  select: typeof messageSelect;
}>;
