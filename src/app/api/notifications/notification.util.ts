import {
  getChannelParam,
  toRecipientPermissions,
} from "@/app/api/tarifications/tarification.util";
import type { GrantDb, UserWithGrants } from "@/app/api/users/user.db.type";
import {
  getAssignedGrants,
  isAgentUser,
  toSessionGrant,
} from "@/app/api/users/user.util";
import {
  formatInstantDateTime,
  getDepartementTimeZone,
} from "@/app/utils/date.util";
import { AUTHOR_LEVEL_LABELS, VISIBILITY_LABELS } from "@/constants";
import {
  GrantScope,
  type TarificationDocumentType,
  TarificationEventType,
} from "@/generated/prisma/enums";
import { canAccessTarification } from "@/lib/casl";
import {
  getEventLabel,
  getTypesLabel,
} from "@/lib/tarification/tarification.anchor";
import { TARIFICATION_SECTION_DEFINITIONS } from "@/lib/tarification/tarification.definition";
import {
  isNotificationEvent,
  type RecipientProfile,
} from "@/lib/tarification/tarification.notification";
import type { NotificationApiRead } from "@/schemas/api/notification.schema";
import type { SessionPermissions } from "@/types/global";
import type { TarificationJournalEvent } from "@/types/tarification.type";

import type {
  NotificationConversationDb,
  NotificationTarificationDb,
} from "./notification.repository";

// La DREETS (grant REGION) n'est destinataire que des contestations : elle a ses propres droits
export const buildNotificationPermissions = (
  user: UserWithGrants
): NotificationPermissions | null => {
  if (user.isSuperAdmin) {
    return null;
  }
  const grants = getAssignedGrants(user);
  const toPermissions = (scopedGrants: GrantDb[]): SessionPermissions => ({
    operateurId: user.operateurId,
    isSuperAdmin: false,
    isAgent: isAgentUser(user),
    grants: scopedGrants.map(toSessionGrant),
  });
  return {
    userId: user.id,
    all: toPermissions(grants),
    departement: toRecipientPermissions(user),
    region: toPermissions(
      grants.filter((grant) => grant.scope === GrantScope.REGION)
    ),
  };
};

const buildNotificationRecipient = (
  permissions: NotificationPermissions,
  structure: NotificationStructure
): RecipientProfile => ({
  userId: permissions.userId,
  isDepartementEditor:
    permissions.all.isAgent &&
    canAccessTarification(permissions.departement, structure),
  isRegionEditor:
    permissions.all.isAgent &&
    canAccessTarification(permissions.region, structure),
  isOperateur:
    !permissions.all.isAgent &&
    canAccessTarification(permissions.all, structure),
});

export const getNotificationEvents = (
  tarification: NotificationTarificationDb,
  permissions: NotificationPermissions,
  since: Date
): (TarificationJournalEvent & { isRead: boolean })[] => {
  const recipient = buildNotificationRecipient(
    permissions,
    tarification.structure
  );
  const journal = {
    events: tarification.events,
    openings: tarification.documents.flatMap((document) => document.openings),
  };
  const readEventIds = new Set(
    tarification.events
      .filter((event) => event.notificationReads.length > 0)
      .map((event) => event.id)
  );
  return tarification.events
    .filter(
      (event) =>
        event.createdAt > since &&
        isNotificationEvent(recipient, event, journal, readEventIds)
    )
    .map((event) => ({ ...event, isRead: readEventIds.has(event.id) }));
};

export const buildEventItems = (
  tarification: NotificationTarificationDb,
  permissions: NotificationPermissions,
  { since, seenAt }: { since: Date; seenAt: Date | null }
): NotificationApiRead[] => {
  const { structure, campaign } = tarification;
  return getNotificationEvents(tarification, permissions, since)
    .filter((event) => !event.isRead)
    .map((event) => {
      const document = tarification.documents.find(
        ({ id }) => id === event.documentId
      );
      return buildItem({
        key: `event-${event.id}`,
        eventId: event.id,
        occurredAt: event.createdAt,
        label: getEventLabel(
          event,
          document ? getTypesLabel(document, campaign.year) : null
        ),
        structure,
        authorLevelLabel: event.authorLevel
          ? AUTHOR_LEVEL_LABELS[event.authorLevel]
          : null,
        href: getTarificationHref(
          structure.id,
          campaign.year,
          getSectionQuery(event, document?.types ?? [])
        ),
        seenAt,
      });
    });
};

// Destinataires de la messagerie : agents de la DDETS seulement (voir getMessageRecipients)
export const buildConversationItem = (
  conversation: NotificationConversationDb,
  permissions: NotificationPermissions,
  seenAt: Date | null
): NotificationApiRead | null => {
  const { structure, campaign } = conversation.structureTarification;
  const [latestUnreadMessage] = conversation.messages;
  if (
    !latestUnreadMessage ||
    !buildNotificationRecipient(permissions, structure).isDepartementEditor
  ) {
    return null;
  }
  const count = conversation._count.messages;
  return buildItem({
    key: `conversation-${conversation.id}`,
    eventId: null,
    occurredAt: latestUnreadMessage.createdAt,
    label: `${count} ${count > 1 ? "nouveaux messages" : "nouveau message"} · ${VISIBILITY_LABELS[conversation.visibility]}`,
    structure,
    authorLevelLabel: null,
    href: getTarificationHref(
      structure.id,
      campaign.year,
      `canal=${getChannelParam(conversation.visibility)}`
    ),
    seenAt,
  });
};

export const sortNotifications = (
  items: NotificationApiRead[]
): NotificationApiRead[] =>
  [...items].sort(
    (first, second) =>
      second.occurredAt.localeCompare(first.occurredAt) ||
      first.key.localeCompare(second.key, undefined, { numeric: true })
  );

// Une DAI déposée dans la campagne se range dans l'étape de l'arrêté, la dernière qui la cite
const getSectionQuery = (
  event: TarificationJournalEvent,
  types: TarificationDocumentType[]
): string | null => {
  if (event.type === TarificationEventType.L48_CONTESTED) {
    return "etape=L48";
  }
  const sectionCode = Object.entries(TARIFICATION_SECTION_DEFINITIONS).findLast(
    ([, section]) =>
      section.types.some((sectionType) => types.includes(sectionType))
  )?.[0];
  return sectionCode ? `etape=${sectionCode}` : null;
};

const getTarificationHref = (
  structureId: number,
  year: number,
  query: string | null
): string =>
  `/structures/${structureId}/tarification/${year}${query ? `?${query}` : ""}`;

const buildItem = ({
  structure,
  occurredAt,
  seenAt,
  ...item
}: Omit<
  NotificationApiRead,
  "occurredAt" | "dateLabel" | "structureCode" | "departement" | "isNew"
> & {
  structure: NotificationStructure;
  occurredAt: Date;
  seenAt: Date | null;
}): NotificationApiRead => ({
  ...item,
  occurredAt: occurredAt.toISOString(),
  dateLabel: formatInstantDateTime(
    occurredAt,
    getDepartementTimeZone(structure.departementAdministratif)
  ),
  structureCode: structure.codeBhasile,
  departement: structure.departementAdministratif,
  isNew: seenAt === null || occurredAt > seenAt,
});

export type NotificationPermissions = {
  userId: number;
  all: SessionPermissions;
  departement: SessionPermissions;
  region: SessionPermissions;
};

type NotificationStructure = NotificationTarificationDb["structure"];
