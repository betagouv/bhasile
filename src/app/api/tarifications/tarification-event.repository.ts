import type { PrismaTransaction } from "@/types/prisma.type";
import type { TarificationJournalEvent } from "@/types/tarification.type";

export const createTarificationEvent = (
  tx: PrismaTransaction,
  structureTarificationId: number,
  event: TarificationEventCreate
): Promise<{ id: number }> =>
  tx.tarificationEvent.create({
    data: { structureTarificationId, ...event },
    select: { id: true },
  });

export type TarificationEventCreate = Omit<
  TarificationJournalEvent,
  "id" | "createdAt"
>;
