import prisma from "@/lib/prisma";

import { buildActiveWindowWhere } from "./announcement.util";

export const findActiveAnnouncements = (now: Date) =>
  prisma.announcement.findMany({
    where: buildActiveWindowWhere(now),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true, content: true },
  });
