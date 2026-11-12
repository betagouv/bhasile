import { Prisma } from "@/generated/prisma/client";

export const buildActiveWindowWhere = (
  now: Date
): Prisma.AnnouncementWhereInput => ({
  AND: [
    { OR: [{ startDate: null }, { startDate: { lte: now } }] },
    { OR: [{ endDate: null }, { endDate: { gte: now } }] },
  ],
});
