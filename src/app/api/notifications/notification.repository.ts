import prisma from "@/lib/prisma";

import { buildActiveWindowWhere } from "./notification.util";

export const findActiveNotifications = (now: Date) =>
  prisma.notification.findMany({
    where: buildActiveWindowWhere(now),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true, content: true },
  });
