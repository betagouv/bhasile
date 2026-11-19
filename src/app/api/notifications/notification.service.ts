import { getUnreadMessageWhere } from "@/app/api/conversations/conversation.db.type";
import { getUserWithGrantsByEmail } from "@/app/api/users/user.repository";
import { normalizeEmail } from "@/app/api/users/user.util";
import { DomainError } from "@/app/utils/domain-error.util";
import type { Prisma } from "@/generated/prisma/client";
import type { TarificationEventType } from "@/generated/prisma/enums";
import { getTarificationStructureWhere } from "@/lib/casl";
import {
  getReceivableEventTypes,
  NOTIFICATION_CONTEXT_TYPES,
} from "@/lib/tarification/tarification.notification";
import type { NotificationApiRead } from "@/schemas/api/notification.schema";
import type { SessionUser } from "@/types/global";

import {
  createNotificationRead,
  findNotificationConversations,
  findNotificationTarifications,
  findNotificationUser,
  updateNotificationSeenAt,
} from "./notification.repository";
import {
  buildConversationItem,
  buildEventItems,
  buildNotificationPermissions,
  getNotificationEvents,
  type NotificationPermissions,
  sortNotifications,
} from "./notification.util";

// Pas de cloche pour un superadmin, sans accès à la tarification, ou messagerie fermée
export const hasNotificationBell = async (
  sessionUser: SessionUser
): Promise<boolean> => (await resolveNotificationContext(sessionUser)) !== null;

export const getNotifications = async (
  sessionUser: SessionUser
): Promise<NotificationApiRead[]> => {
  const context = await resolveNotificationContext(sessionUser);
  if (!context) {
    return [];
  }
  return loadNotifications(context, {
    eventsSince: context.createdAt,
    messagesSince: null,
  });
};

export const countNotifications = async (
  sessionUser: SessionUser
): Promise<number> => {
  const context = await resolveNotificationContext(sessionUser);
  if (!context) {
    return 0;
  }
  const items = await loadNotifications(context, {
    eventsSince:
      context.seenAt && context.seenAt > context.createdAt
        ? context.seenAt
        : context.createdAt,
    messagesSince: context.seenAt,
  });
  return items.length;
};

export const markNotificationsSeen = async (
  sessionUser: SessionUser,
  seenUntil: Date
): Promise<void> => {
  const context = await resolveNotificationContext(sessionUser);
  if (context) {
    await updateNotificationSeenAt(context.permissions.userId, seenUntil);
  }
};

export const markNotificationRead = async (
  sessionUser: SessionUser,
  eventId: number
): Promise<void> => {
  const context = await resolveNotificationContext(sessionUser);
  if (!context) {
    throw new DomainError("Notification introuvable", 404);
  }
  const [tarification] = await findNotificationTarifications({
    where: {
      structure: context.structureWhere,
      events: { some: { id: eventId } },
    },
    eventWhere: {
      OR: [{ id: eventId }, { type: { in: NOTIFICATION_CONTEXT_TYPES } }],
    },
    userId: context.permissions.userId,
  });
  const isNotificationEvent =
    tarification &&
    getNotificationEvents(
      tarification,
      context.permissions,
      context.createdAt
    ).some((event) => event.id === eventId);
  if (!isNotificationEvent) {
    throw new DomainError("Notification introuvable", 404);
  }
  await createNotificationRead(context.permissions.userId, eventId);
};

const loadNotifications = async (
  {
    permissions,
    structureWhere,
    departementStructureWhere,
    receivableTypes,
    seenAt,
  }: NotificationContext,
  {
    eventsSince,
    messagesSince,
  }: { eventsSince: Date; messagesSince: Date | null }
): Promise<NotificationApiRead[]> => {
  const { userId } = permissions;
  const candidateWhere = {
    type: { in: receivableTypes },
    createdAt: { gt: eventsSince },
  };
  const unreadMessageWhere = getUnreadMessageWhere(userId);
  const candidateMessageWhere = messagesSince
    ? { ...unreadMessageWhere, createdAt: { gt: messagesSince } }
    : unreadMessageWhere;
  const [tarifications, conversations] = await Promise.all([
    findNotificationTarifications({
      where: { structure: structureWhere, events: { some: candidateWhere } },
      eventWhere: {
        OR: [candidateWhere, { type: { in: NOTIFICATION_CONTEXT_TYPES } }],
      },
      userId,
    }),
    departementStructureWhere
      ? findNotificationConversations({
          where: {
            structureTarification: { structure: departementStructureWhere },
            messages: { some: candidateMessageWhere },
          },
          unreadMessageWhere,
        })
      : [],
  ]);
  return sortNotifications([
    ...tarifications.flatMap((tarification) =>
      buildEventItems(tarification, permissions, {
        since: eventsSince,
        seenAt,
      })
    ),
    ...conversations.flatMap(
      (conversation) =>
        buildConversationItem(conversation, permissions, seenAt) ?? []
    ),
  ]);
};

const resolveNotificationContext = async (
  sessionUser: SessionUser
): Promise<NotificationContext | null> => {
  const user = await getUserWithGrantsByEmail({
    email: normalizeEmail(sessionUser.email),
  });
  const permissions = user && buildNotificationPermissions(user);
  const structureWhere =
    permissions && getTarificationStructureWhere(permissions.all);
  if (!permissions || !structureWhere) {
    return null;
  }
  const { isAgent } = permissions.all;
  const departementStructureWhere = isAgent
    ? getTarificationStructureWhere(permissions.departement)
    : null;
  const { createdAt, notificationSeenAt } = await findNotificationUser(
    permissions.userId
  );
  return {
    permissions,
    structureWhere,
    departementStructureWhere,
    receivableTypes: getReceivableEventTypes({
      isDepartementEditor: departementStructureWhere !== null,
      isRegionEditor:
        isAgent && getTarificationStructureWhere(permissions.region) !== null,
      isOperateur: !isAgent,
    }),
    createdAt,
    seenAt: notificationSeenAt,
  };
};

type NotificationContext = {
  permissions: NotificationPermissions;
  structureWhere: Prisma.StructureWhereInput;
  departementStructureWhere: Prisma.StructureWhereInput | null;
  receivableTypes: TarificationEventType[];
  createdAt: Date;
  seenAt: Date | null;
};
