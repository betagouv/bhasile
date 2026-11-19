import {
  AuthorLevel,
  PrismaClient,
  TarificationEventType,
} from "@/generated/prisma/client";

import { TEST_USER_DEPARTEMENT } from "./role.seed";

// Les journaux du seed sont datés dans le passé, alors que les comptes sont créés au seed : sans les antidater,
// la cloche (bornée à la création du compte) resterait vide. Un dépôt traité et un repère à mi-parcours, pris dans
// le département de l'agent départemental, montrent les trois états d'une ligne : nouvelle, vue, traitée
export const createFakeNotificationStates = async (
  prisma: PrismaClient
): Promise<void> => {
  const events = await prisma.tarificationEvent.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      type: true,
      authorLevel: true,
      createdAt: true,
      structureTarification: {
        select: { structure: { select: { departementAdministratif: true } } },
      },
    },
  });
  const [firstEvent] = events;
  if (!firstEvent) {
    return;
  }
  await prisma.user.updateMany({
    where: { isSuperAdmin: false },
    data: { createdAt: new Date(firstEvent.createdAt.getTime() - DAY_MS) },
  });
  const departementEvents = events.filter(
    (event) =>
      event.structureTarification.structure.departementAdministratif ===
      TEST_USER_DEPARTEMENT
  );
  if (departementEvents.length === 0) {
    return;
  }
  const departementalAgent = await prisma.user.findFirstOrThrow({
    where: { email: { startsWith: "departemental@" } },
    select: { id: true },
  });
  await prisma.user.update({
    where: { id: departementalAgent.id },
    data: {
      notificationSeenAt:
        departementEvents[Math.floor(departementEvents.length / 2)].createdAt,
    },
  });
  const firstOperateurDeposit = departementEvents.find(
    (event) =>
      event.type === TarificationEventType.DOCUMENT_DEPOSITED &&
      event.authorLevel === AuthorLevel.OPERATEUR
  );
  if (firstOperateurDeposit) {
    await prisma.notificationRead.create({
      data: {
        userId: departementalAgent.id,
        tarificationEventId: firstOperateurDeposit.id,
      },
    });
  }
};

const DAY_MS = 24 * 60 * 60 * 1000;
