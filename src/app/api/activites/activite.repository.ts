import { Activite } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

export const findActivitesByDnaCodesAndDate = (
  dnaCodes: string[],
  startDate: Date,
  endDate: Date
): Promise<Activite[]> =>
  prisma.activite.findMany({
    where: {
      dnaCode: { in: dnaCodes },
      date: { gte: startDate, lte: endDate },
    },
  });
