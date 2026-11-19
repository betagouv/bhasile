import {
  createDepartementPerimeter,
  createRegionPerimeter,
  createUserWithGrants,
} from "tests/test-utils/factories/user-with-grants.factory";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  NotificationConversationDb,
  NotificationTarificationDb,
} from "@/app/api/notifications/notification.repository";
import {
  buildConversationItem,
  buildEventItems,
  buildNotificationPermissions,
  type NotificationPermissions,
  sortNotifications,
} from "@/app/api/notifications/notification.util";
import type { PerimeterDb } from "@/app/api/users/user.db.type";
import {
  AuthorLevel,
  TarificationDocumentStatus,
  TarificationEventType,
  Visibility,
} from "@/generated/prisma/enums";
import type { NotificationApiRead } from "@/schemas/api/notification.schema";

const AGENT_ID = 30;
const STRUCTURE = {
  id: 42,
  codeBhasile: "CADA-35-001",
  departementAdministratif: "35",
  operateurId: 7,
};

const DDETS_PERIMETER = createDepartementPerimeter("35", "Ille-et-Vilaine");
const DREETS_PERIMETER = createRegionPerimeter();

const buildPermissions = (perimeter: PerimeterDb): NotificationPermissions =>
  buildNotificationPermissions(
    createUserWithGrants({ id: AGENT_ID, perimeter })
  )!;

const buildEvent = (
  overrides: Partial<NotificationTarificationDb["events"][number]> &
    Pick<
      NotificationTarificationDb["events"][number],
      "id" | "type" | "createdAt"
    >
): NotificationTarificationDb["events"][number] => ({
  authorId: 10,
  authorLevel: AuthorLevel.OPERATEUR,
  documentId: 1,
  stepCode: null,
  text: null,
  notificationReads: [],
  ...overrides,
});

const buildTarification = (
  events: NotificationTarificationDb["events"],
  types: NotificationTarificationDb["documents"][number]["types"] = ["CA"]
): NotificationTarificationDb => ({
  campaign: { year: 2028 },
  structure: STRUCTURE,
  documents: [
    { id: 1, types, status: TarificationDocumentStatus.FINAL, openings: [] },
  ],
  events,
});

const SINCE = new Date("2028-04-01T00:00:00Z");

describe("buildNotificationPermissions", () => {
  beforeEach(() => {
    vi.stubEnv("MESSAGERIE_ENABLED", "true");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("ne donne pas de cloche à un superadmin", () => {
    expect(
      buildNotificationPermissions(createUserWithGrants({ isSuperAdmin: true }))
    ).toBeNull();
  });

  it("ne compte pas un grant régional parmi les droits de la DDETS", () => {
    const deposit = buildEvent({
      id: 1,
      type: TarificationEventType.DOCUMENT_DEPOSITED,
      createdAt: new Date("2028-04-10T08:00:00Z"),
    });

    const items = buildEventItems(
      buildTarification([deposit]),
      buildPermissions(DREETS_PERIMETER),
      { since: SINCE, seenAt: null }
    );

    expect(items).toEqual([]);
  });
});

describe("buildEventItems", () => {
  beforeEach(() => {
    vi.stubEnv("MESSAGERIE_ENABLED", "true");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("construit la ligne d'un dépôt de l'opérateur, avec son étape, sa date locale et sa nouveauté", () => {
    const deposit = buildEvent({
      id: 5,
      type: TarificationEventType.DOCUMENT_DEPOSITED,
      createdAt: new Date("2028-04-10T08:00:00Z"),
    });

    const [item] = buildEventItems(
      buildTarification([deposit]),
      buildPermissions(DDETS_PERIMETER),
      { since: SINCE, seenAt: new Date("2028-04-09T00:00:00Z") }
    );

    expect(item).toEqual({
      key: "event-5",
      eventId: 5,
      occurredAt: "2028-04-10T08:00:00.000Z",
      dateLabel: "10/04/2028 10:00",
      label: "Dépôt : Compte administratif 2026",
      structureCode: "CADA-35-001",
      departement: "35",
      authorLevelLabel: "Opérateur",
      href: "/structures/42/tarification/2028?etape=CA",
      isNew: true,
    });
  });

  it("mène une contestation de la L48 à l'étape de la L48", () => {
    const contestation = buildEvent({
      id: 6,
      type: TarificationEventType.L48_CONTESTED,
      documentId: null,
      createdAt: new Date("2028-04-10T08:00:00Z"),
    });

    const [item] = buildEventItems(
      buildTarification([contestation]),
      buildPermissions(DDETS_PERIMETER),
      { since: SINCE, seenAt: null }
    );

    expect(item.href).toBe("/structures/42/tarification/2028?etape=L48");
  });

  it("mène un document sans étape à la page de la campagne", () => {
    const deposit = buildEvent({
      id: 5,
      type: TarificationEventType.DOCUMENT_DEPOSITED,
      createdAt: new Date("2028-04-10T08:00:00Z"),
    });

    const [item] = buildEventItems(
      buildTarification([deposit], ["PIECE_JUSTIFICATIVE"]),
      buildPermissions(DDETS_PERIMETER),
      { since: SINCE, seenAt: null }
    );

    expect(item.href).toBe("/structures/42/tarification/2028");
  });

  it("ne marque pas comme nouvelle la ligne datée du repère", () => {
    const occurredAt = new Date("2028-04-10T08:00:00Z");
    const deposit = buildEvent({
      id: 5,
      type: TarificationEventType.DOCUMENT_DEPOSITED,
      createdAt: occurredAt,
    });

    const [item] = buildEventItems(
      buildTarification([deposit]),
      buildPermissions(DDETS_PERIMETER),
      { since: SINCE, seenAt: occurredAt }
    );

    expect(item.isNew).toBe(false);
  });

  it("écarte les faits traités et ceux antérieurs à la borne", () => {
    const events = [
      buildEvent({
        id: 1,
        type: TarificationEventType.DOCUMENT_DEPOSITED,
        createdAt: new Date("2028-03-01T00:00:00Z"),
      }),
      buildEvent({
        id: 2,
        type: TarificationEventType.DOCUMENT_DEPOSITED,
        createdAt: new Date("2028-04-10T00:00:00Z"),
        notificationReads: [{ userId: AGENT_ID }],
      }),
    ];

    expect(
      buildEventItems(
        buildTarification(events),
        buildPermissions(DDETS_PERIMETER),
        { since: SINCE, seenAt: null }
      )
    ).toEqual([]);
  });

  it("range une DAI de la campagne dans l'étape de l'arrêté", () => {
    const deposit = buildEvent({
      id: 1,
      type: TarificationEventType.DOCUMENT_DEPOSITED,
      createdAt: new Date("2028-04-10T00:00:00Z"),
    });

    const [item] = buildEventItems(
      buildTarification([deposit], ["DAI"]),
      buildPermissions(DDETS_PERIMETER),
      { since: SINCE, seenAt: null }
    );

    expect(item.href).toBe("/structures/42/tarification/2028?etape=ARRETE");
  });
});

describe("buildConversationItem", () => {
  beforeEach(() => {
    vi.stubEnv("MESSAGERIE_ENABLED", "true");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const conversation: NotificationConversationDb = {
    id: 9,
    visibility: Visibility.AGENTS,
    structureTarification: { campaign: { year: 2028 }, structure: STRUCTURE },
    messages: [{ createdAt: new Date("2028-04-10T08:00:00Z") }],
    _count: { messages: 3 },
  };

  it("résume les messages non lus d'une conversation et ouvre son canal", () => {
    const item = buildConversationItem(
      conversation,
      buildPermissions(DDETS_PERIMETER),
      new Date("2028-04-11T00:00:00Z")
    );

    expect(item).toMatchObject({
      key: "conversation-9",
      eventId: null,
      label: "3 nouveaux messages · Services de l’État seulement",
      href: "/structures/42/tarification/2028?canal=agents",
      isNew: false,
    });
  });

  it("ne signale pas les messages à la DREETS", () => {
    expect(
      buildConversationItem(
        conversation,
        buildPermissions(DREETS_PERIMETER),
        null
      )
    ).toBeNull();
  });
});

describe("sortNotifications", () => {
  const buildSortItem = (
    key: string,
    occurredAt: string
  ): NotificationApiRead => ({
    key,
    eventId: null,
    occurredAt,
    dateLabel: "",
    label: "",
    structureCode: "CADA-35-001",
    departement: "35",
    authorLevelLabel: null,
    href: "/",
    isNew: false,
  });

  it("range du plus récent au plus ancien, puis par clé dans l'ordre numérique", () => {
    const sortedKeys = sortNotifications([
      buildSortItem("event-1", "2028-04-01T00:00:00.000Z"),
      buildSortItem("event-10", "2028-04-10T00:00:00.000Z"),
      buildSortItem("event-9", "2028-04-10T00:00:00.000Z"),
    ]).map(({ key }) => key);

    expect(sortedKeys).toEqual(["event-9", "event-10", "event-1"]);
  });
});
